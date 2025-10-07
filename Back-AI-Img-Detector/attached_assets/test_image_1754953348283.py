import numpy as np
import pandas as pd
import torch
from PIL import Image
import matplotlib.pyplot as plt
import matplotlib.animation as animation
from scipy.ndimage import gaussian_filter
import pandas as pd
from skimage.feature import graycomatrix, graycoprops
from torchvision import transforms

# Load the image
image = Image.open("midjourney-images-example.jpg")

# Set Parameters
top_k_patches = 5
classes = ['authentic', 'dalle-3-images', 'diffusiondb', 'midjourney-images', 'midjourney_tti', 'realisticSDXL']
patch_size = 224

width, height = image.size

# Calculate the number of patches
num_patches_x = width // patch_size
num_patches_y = height // patch_size

# Divide the image in patches
patches = np.zeros((num_patches_x * num_patches_y, patch_size, patch_size, 3), dtype=np.uint8)
patch_predictions = np.zeros((num_patches_x * num_patches_y))
for i in range(num_patches_x):
    for j in range(num_patches_y):
        x = i * patch_size
        y = j * patch_size
        patch = image.crop((x, y, x + patch_size, y + patch_size))
        patches[i * num_patches_y + j] = np.array(patch)

# Compute the most relevant patches (optional)
dissimilarity_scores = []
for patch in patches:
    transform_patch = transforms.Compose([transforms.PILToTensor(), transforms.Grayscale()])
    grayscale_patch = transform_patch(Image.fromarray(patch)).squeeze(0)
    glcm = graycomatrix(grayscale_patch, [5], [0], 256, symmetric=True, normed=True)
    dissimilarity_scores.append(graycoprops(glcm, "contrast")[0, 0])

# Sort patch indices by their dissimilarity score
sorted_indices = np.argsort(dissimilarity_scores)[::-1]

# Extract top k patches and convert them to tensor
top_patches = patches[sorted_indices[:top_k_patches]]
top_patches = torch.from_numpy(np.transpose(top_patches, (0, 3, 1, 2))) / 255.0

# Predict patches
model = torch.jit.load("SuSy.pt")
model.eval()
with torch.no_grad():
    preds = model(top_patches)

 # Store predictions for top patches
    for k, idx in enumerate(sorted_indices[:top_k_patches]):
        patch_predictions[idx] = preds[k].numpy().max() #probability of the most likely class

# --- Heatmap Generation ---

heatmap = np.zeros((num_patches_y, num_patches_x))    
for i in range(num_patches_x):
    for j in range(num_patches_y):
        heatmap[j, i] = patch_predictions[i * num_patches_y + j]

# --- Upscale heatmap using Image resizing for smooth interpolation ---
# This approach is more robust and avoids the boundary issues of manual interpolation.

# 1. Normalize heatmap to 0-255 and convert to an 8-bit grayscale image
heatmap_normalized = (heatmap * 255).astype(np.uint8)
low_res_heatmap_img = Image.fromarray(heatmap_normalized, mode='L')

# 2. Resize the low-resolution heatmap to the full image dimensions using a high-quality filter
high_res_heatmap_img = low_res_heatmap_img.resize((width, height), resample=Image.BICUBIC)

# 3. Convert the resized image back to a numpy array and scale back to 0-1 for plotting
heatmap_resized = np.array(high_res_heatmap_img) / 255.0

# --- Aggregate and Print Results ---

print("--- Individual Predictions for Top 5 Patches ---")
patch_results = pd.DataFrame(preds.numpy(), columns=classes)
print(patch_results)

# To get a single classification for the whole image, we need to aggregate patch results.
# Taking the maximum score for each class is a strong approach for this task.
# If even one patch contains a clear artifact (leading to a high score for a generated class),
# this method will capture it. Averaging could dilute such a signal.
aggregated_scores = preds.max(dim=0).values
final_prediction_idx = aggregated_scores.argmax()
final_prediction_class = classes[final_prediction_idx]

print("\n--- Aggregated Result for the Whole Image (Max Score) ---")
final_result = pd.DataFrame(aggregated_scores.numpy(), index=classes, columns=['score']).T
print(final_result)
print(f"\nFinal Verdict: The image is classified as '{final_prediction_class}'")

# --- Static Heatmap Visualization ---

# Create a figure with two subplots: one for the image, one for the bar chart.
# The height ratio makes the image plot taller than the bar chart plot.
fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10, 12),
                               gridspec_kw={'height_ratios': [4, 1]})

# --- Top Plot: Image and Heatmap ---
ax1.imshow(image, extent=[0, width, 0, height])

# Overlay the final heatmap
heatmap_plot = ax1.imshow(heatmap_resized, cmap='coolwarm',
                          extent=[0, width, 0, height], alpha=0.5, vmin=0, vmax=1)

# Add a colorbar
fig.colorbar(heatmap_plot, ax=ax1, label='AI-Generated Likelihood (Red = High)')

# Construct the title with the final verdict and score
max_score = aggregated_scores.max().item()
title_text = (f"Final Verdict: {final_prediction_class} (Score: {max_score:.2f})\n"
              f"Heatmap of AI-Generated Likelihood")
ax1.set_xlabel('Width (pixels)')
ax1.set_ylabel('Height (pixels)')
ax1.set_title(title_text)

# --- Bottom Plot: Horizontal Bar Chart of Scores ---
scores = aggregated_scores.numpy()
bars = ax2.barh(classes, scores, align='center')
ax2.invert_yaxis()  # Invert y-axis to have the first class at the top
ax2.set_xlabel('Score')
ax2.set_title('Aggregated Scores per Class')
ax2.set_xlim(0, 1)  # Scores are between 0 and 1
ax2.bar_label(bars, fmt='%.3f', padding=3) # Add score labels to bars

# Adjust layout to prevent labels from overlapping and display the plot
plt.tight_layout()

# Display the plot
plt.show()
