// AI Image Detector Frontend JavaScript

class AIImageDetector {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.checkAPIHealth();
    }

    initializeElements() {
        this.uploadForm = document.getElementById('uploadForm');
        this.imageFile = document.getElementById('imageFile');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.loadingCard = document.getElementById('loadingCard');
        this.errorCard = document.getElementById('errorCard');
        this.resultsCard = document.getElementById('resultsCard');
        this.errorMessage = document.getElementById('errorMessage');
    }

    bindEvents() {
        this.uploadForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.analyzeImage();
        });

        this.imageFile.addEventListener('change', () => {
            this.hideCards();
        });
    }

    async checkAPIHealth() {
        try {
            const response = await fetch('/api/health');
            const data = await response.json();
            
            if (!data.model_loaded) {
                this.showError('AI model is not loaded. Please check server configuration.');
            }
        } catch (error) {
            console.warn('Could not check API health:', error);
        }
    }

    hideCards() {
        this.loadingCard.classList.add('d-none');
        this.errorCard.classList.add('d-none');
        this.resultsCard.classList.add('d-none');
    }

    showLoading() {
        this.hideCards();
        this.loadingCard.classList.remove('d-none');
        this.analyzeBtn.disabled = true;
        this.analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Analyzing...';
    }

    hideLoading() {
        this.loadingCard.classList.add('d-none');
        this.analyzeBtn.disabled = false;
        this.analyzeBtn.innerHTML = '<i class="fas fa-search me-2"></i>Analyze Image';
    }

    showError(message) {
        this.hideLoading();
        this.errorMessage.textContent = message;
        this.errorCard.classList.remove('d-none');
    }

    showResults(results) {
        this.hideLoading();
        
        // Update overall classification
        document.getElementById('predictedClass').textContent = results.predicted_class;
        document.getElementById('overallScore').textContent = `Score: ${(results.overall_score * 100).toFixed(1)}%`;
        
        // Update image info
        const imageInfo = `${results.image_size.width} × ${results.image_size.height} pixels<br>
                          ${results.patches_analyzed} patches analyzed`;
        document.getElementById('imageInfo').innerHTML = imageInfo;
        
        // Update heatmap
        const heatmapImg = document.getElementById('heatmapImage');
        heatmapImg.src = `data:image/png;base64,${results.heatmap_image}`;
        
        // Update class scores
        this.renderClassScores(results.class_scores);
        
        // Show results card with animation
        this.resultsCard.classList.remove('d-none');
        this.resultsCard.classList.add('fade-in');
        
        // Scroll to results
        this.resultsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    renderClassScores(scores) {
        const container = document.getElementById('classScores');
        container.innerHTML = '';
        
        // Sort scores by value (descending)
        const sortedScores = Object.entries(scores)
            .sort(([,a], [,b]) => b - a);
        
        sortedScores.forEach(([className, score], index) => {
            const percentage = (score * 100).toFixed(1);
            const isHighest = index === 0;
            
            const scoreItem = document.createElement('div');
            scoreItem.className = 'mb-3';
            
            const scoreClass = this.getScoreClass(className, score);
            const badgeClass = isHighest ? 'bg-primary' : 'bg-secondary';
            
            scoreItem.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="fw-medium">${this.formatClassName(className)}</span>
                    <span class="badge ${badgeClass}">${percentage}%</span>
                </div>
                <div class="progress" style="height: 8px;">
                    <div class="progress-bar ${scoreClass}" 
                         role="progressbar" 
                         style="width: ${percentage}%" 
                         aria-valuenow="${percentage}" 
                         aria-valuemin="0" 
                         aria-valuemax="100">
                    </div>
                </div>
            `;
            
            container.appendChild(scoreItem);
        });
    }

    getScoreClass(className, score) {
        if (className === 'authentic') {
            return score > 0.5 ? 'bg-success' : 'bg-secondary';
        } else {
            return score > 0.5 ? 'bg-danger' : 'bg-secondary';
        }
    }

    formatClassName(className) {
        return className
            .replace(/-/g, ' ')
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    async analyzeImage() {
        const file = this.imageFile.files[0];
        
        if (!file) {
            this.showError('Please select an image file.');
            return;
        }

        // Validate file size (16MB limit)
        if (file.size > 16 * 1024 * 1024) {
            this.showError('File is too large. Maximum size is 16MB.');
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showError('Please select a valid image file.');
            return;
        }

        this.showLoading();

        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch('/api/detect', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            if (data.success) {
                this.showResults(data.results);
            } else {
                throw new Error(data.error || 'Analysis failed');
            }

        } catch (error) {
            console.error('Analysis error:', error);
            this.showError(`Analysis failed: ${error.message}`);
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AIImageDetector();
});
