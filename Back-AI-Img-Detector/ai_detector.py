import numpy as np
import pandas as pd
import torch
from PIL import Image
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
from scipy.ndimage import gaussian_filter
from skimage.feature import graycomatrix, graycoprops
from torchvision import transforms
import io
import base64
import logging
import os

class AIImageDetector:
    def __init__(self, model_path="SuSy.pt"):
        """
        Initialize the AI Image Detector.
        
        Args:
            model_path: Path to the PyTorch model file
        """
        self.model_path = model_path
        self.model = None
        self.classes = ['authentic', 'dalle-3-images', 'diffusiondb', 'midjourney-images', 'midjourney_tti', 'realisticSDXL']
        self.patch_size = 224
        self.top_k_patches = 5
        
        # Load the model
        self._load_model()
    
    def _load_model(self):
        """Load the PyTorch model."""
        try:
            if os.path.exists(self.model_path):
                self.model = torch.jit.load(self.model_path, map_location='cpu')
                self.model.eval()
                logging.info(f"Model loaded successfully from {self.model_path}")
            else:
                logging.error(f"Model file not found: {self.model_path}")
                raise FileNotFoundError(f"Model file not found: {self.model_path}")
        except Exception as e:
            logging.error(f"Failed to load model: {str(e)}")
            raise
    
    def is_model_loaded(self):
        """Check if the model is loaded."""
        return self.model is not None
    
    def analyze_image(self, image_file):
        """
        Analyze an uploaded image for AI generation likelihood.
        
        Args:
            image_file: Flask file object
            
        Returns:
            Dictionary containing analysis results
        """
        if not self.is_model_loaded():
            raise RuntimeError("Model is not loaded")
        
        # Load and validate image
        try:
            image = Image.open(image_file).convert('RGB')
            logging.info(f"Image loaded: {image.size}")
        except Exception as e:
            raise ValueError(f"Invalid image file: {str(e)}")
        
        # Extract patches and analyze
        patches, patch_predictions = self._extract_and_analyze_patches(image)
        
        # Generate heatmap
        heatmap_b64 = self._generate_heatmap(image, patch_predictions)
        
        # Calculate aggregated scores
        aggregated_scores = self._calculate_aggregated_scores(patches)
        
        # Prepare results
        results = {
            'overall_score': float(aggregated_scores.max()),
            'predicted_class': self.classes[aggregated_scores.argmax()],
            'class_scores': {
                class_name: float(score) 
                for class_name, score in zip(self.classes, aggregated_scores)
            },
            'heatmap_image': heatmap_b64,
            'image_size': {
                'width': image.size[0],
                'height': image.size[1]
            },
            'patches_analyzed': len(patches)
        }
        
        return results
    
    def _extract_and_analyze_patches(self, image):
        """Extract patches from image and analyze them."""
        width, height = image.size
        
        # Calculate the number of patches
        num_patches_x = width // self.patch_size
        num_patches_y = height // self.patch_size
        
        if num_patches_x == 0 or num_patches_y == 0:
            raise ValueError(f"Image too small. Minimum size: {self.patch_size}x{self.patch_size}")
        
        # Divide the image into patches
        patches = np.zeros((num_patches_x * num_patches_y, self.patch_size, self.patch_size, 3), dtype=np.uint8)
        patch_predictions = np.zeros((num_patches_x * num_patches_y))
        
        for i in range(num_patches_x):
            for j in range(num_patches_y):
                x = i * self.patch_size
                y = j * self.patch_size
                patch = image.crop((x, y, x + self.patch_size, y + self.patch_size))
                patches[i * num_patches_y + j] = np.array(patch)
        
        # Compute dissimilarity scores for patch selection
        dissimilarity_scores = []
        for patch in patches:
            transform_patch = transforms.Compose([transforms.PILToTensor(), transforms.Grayscale()])
            grayscale_patch = transform_patch(Image.fromarray(patch)).squeeze(0)
            glcm = graycomatrix(grayscale_patch, [5], [0], 256, symmetric=True, normed=True)
            dissimilarity_scores.append(graycoprops(glcm, "contrast")[0, 0])
        
        # Sort patch indices by dissimilarity score
        sorted_indices = np.argsort(dissimilarity_scores)[::-1]
        
        # Extract top k patches and convert to tensor
        top_patches = patches[sorted_indices[:self.top_k_patches]]
        top_patches = torch.from_numpy(np.transpose(top_patches, (0, 3, 1, 2))) / 255.0
        
        # Predict patches
        with torch.no_grad():
            preds = self.model(top_patches)
        
        # Store predictions for top patches
        for k, idx in enumerate(sorted_indices[:self.top_k_patches]):
            patch_predictions[idx] = preds[k].numpy().max()  # probability of the most likely class
        
        return top_patches, patch_predictions
    
    def _calculate_aggregated_scores(self, top_patches):
        """Calculate aggregated scores for the entire image."""
        with torch.no_grad():
            preds = self.model(top_patches)
        
        # Aggregate scores using max approach
        aggregated_scores = preds.max(dim=0).values
        return aggregated_scores.numpy()
    
    def _generate_heatmap(self, image, patch_predictions):
        """Generate heatmap visualization and return as base64 encoded image."""
        width, height = image.size
        num_patches_x = width // self.patch_size
        num_patches_y = height // self.patch_size
        
        # Create heatmap array
        heatmap = np.zeros((num_patches_y, num_patches_x))
        for i in range(num_patches_x):
            for j in range(num_patches_y):
                heatmap[j, i] = patch_predictions[i * num_patches_y + j]
        
        # Upscale heatmap using bicubic interpolation
        heatmap_normalized = (heatmap * 255).astype(np.uint8)
        low_res_heatmap_img = Image.fromarray(heatmap_normalized, mode='L')
        high_res_heatmap_img = low_res_heatmap_img.resize((width, height), resample=Image.BICUBIC)
        heatmap_resized = np.array(high_res_heatmap_img) / 255.0
        
        # Create visualization
        fig, ax = plt.subplots(figsize=(12, 8))
        
        # Display original image
        ax.imshow(image, extent=[0, width, 0, height])
        
        # Overlay heatmap
        heatmap_plot = ax.imshow(heatmap_resized, cmap='coolwarm',
                                extent=[0, width, 0, height], alpha=0.6, vmin=0, vmax=1)
        
        # Add colorbar
        cbar = fig.colorbar(heatmap_plot, ax=ax, label='AI-Generated Likelihood')
        cbar.ax.tick_params(labelsize=10)
        
        # Set title and labels
        max_score = patch_predictions.max()
        ax.set_title(f'AI Detection Heatmap (Max Score: {max_score:.3f})', fontsize=14, pad=20)
        ax.set_xlabel('Width (pixels)', fontsize=12)
        ax.set_ylabel('Height (pixels)', fontsize=12)
        
        # Save to base64
        buffer = io.BytesIO()
        plt.tight_layout()
        plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight')
        buffer.seek(0)
        
        # Convert to base64
        image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        # Clean up
        plt.close(fig)
        buffer.close()
        
        return image_base64
