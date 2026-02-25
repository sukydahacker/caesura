"""
Test Design Upload Validation - Relaxed Creator-Friendly Validation

Testing the following validation thresholds:
- Hard fail: minShortSide < 1500px
- Soft pass: minShortSide >= 3000px (acceptable with warnings)
- Preferred: 4500x5400px (no warnings)
- Format: PNG preferred, JPEG/WebP accepted with warning
- Embroidery: maxColors=4 (warning), hardMaxColors=6 (disable)
"""

import pytest
import requests
import os
import base64
from PIL import Image
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
TEST_SESSION_TOKEN = 'test_creator_session_1771988899501'


class TestDesignValidationBackend:
    """Backend API tests for design creation with various analysis data"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup session for authenticated requests"""
        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {TEST_SESSION_TOKEN}'
        }
    
    def create_test_image_base64(self, width, height, format='PNG', has_transparency=True):
        """Create a test image and return base64 encoded data URL"""
        mode = 'RGBA' if has_transparency and format == 'PNG' else 'RGB'
        img = Image.new(mode, (width, height), (255, 0, 0, 255) if mode == 'RGBA' else (255, 0, 0))
        buffer = io.BytesIO()
        img.save(buffer, format=format)
        buffer.seek(0)
        b64 = base64.b64encode(buffer.read()).decode('utf-8')
        mime = f'image/{format.lower()}'
        return f"data:{mime};base64,{b64}"
    
    def test_health_check(self):
        """Test that API is accessible"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        print("PASS: API is accessible")
    
    def test_create_design_with_optimal_dimensions(self):
        """Test design creation with optimal 4500x5400 dimensions"""
        image_url = self.create_test_image_base64(4500, 5400)
        
        design_data = {
            "title": "TEST_Optimal Dimensions Design",
            "description": "Testing optimal 4500x5400 dimensions",
            "image_url": image_url,
            "analysis": {
                "width": 4500,
                "height": 5400,
                "hasTransparency": True,
                "colorCount": 3,
                "hasGradients": False,
                "quality": "optimal",
                "adminFlags": []
            },
            "products": [
                {"productType": "tshirt", "color": "white", "preset": "tshirt", "printMethod": "dtf", "basePrice": 799}
            ]
        }
        
        response = requests.post(f"{BASE_URL}/api/designs", json=design_data, headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data.get("design_analysis", {}).get("quality") == "optimal"
        print("PASS: Design with optimal dimensions created successfully")
        
        # Cleanup
        design_id = data.get("design_id")
        if design_id:
            requests.delete(f"{BASE_URL}/api/designs/{design_id}", headers=self.headers)
    
    def test_create_design_with_acceptable_dimensions(self):
        """Test design creation with acceptable 3000px dimensions (soft pass)"""
        image_url = self.create_test_image_base64(3000, 3500)
        
        design_data = {
            "title": "TEST_Acceptable Dimensions Design",
            "description": "Testing acceptable 3000px dimensions",
            "image_url": image_url,
            "analysis": {
                "width": 3000,
                "height": 3500,
                "hasTransparency": True,
                "colorCount": 3,
                "hasGradients": False,
                "quality": "acceptable",
                "adminFlags": []
            },
            "products": [
                {"productType": "tshirt", "color": "white", "preset": "tshirt", "printMethod": "dtf", "basePrice": 799}
            ]
        }
        
        response = requests.post(f"{BASE_URL}/api/designs", json=design_data, headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        # Acceptable quality should be stored
        print(f"Created design with quality: {data.get('design_analysis', {}).get('quality')}")
        print("PASS: Design with acceptable dimensions (3000px) created successfully")
        
        # Cleanup
        design_id = data.get("design_id")
        if design_id:
            requests.delete(f"{BASE_URL}/api/designs/{design_id}", headers=self.headers)
    
    def test_create_design_with_low_resolution(self):
        """Test design creation with low resolution (1500-3000px - needs optimization)"""
        image_url = self.create_test_image_base64(2000, 2000)
        
        design_data = {
            "title": "TEST_Low Resolution Design",
            "description": "Testing low resolution 2000px dimensions",
            "image_url": image_url,
            "analysis": {
                "width": 2000,
                "height": 2000,
                "hasTransparency": True,
                "colorCount": 3,
                "hasGradients": False,
                "quality": "needs_optimization",
                "adminFlags": ["low_resolution"]
            },
            "products": [
                {"productType": "tshirt", "color": "white", "preset": "tshirt", "printMethod": "dtf", "basePrice": 799}
            ]
        }
        
        response = requests.post(f"{BASE_URL}/api/designs", json=design_data, headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        # Check that admin flags are stored
        admin_flags = data.get("design_analysis", {}).get("adminFlags", [])
        assert "low_resolution" in admin_flags
        print("PASS: Design with low resolution created with adminFlags")
        
        # Cleanup
        design_id = data.get("design_id")
        if design_id:
            requests.delete(f"{BASE_URL}/api/designs/{design_id}", headers=self.headers)
    
    def test_create_design_with_format_conversion_needed(self):
        """Test design creation with non-PNG format that needs conversion"""
        # Create JPEG image
        image_url = self.create_test_image_base64(3500, 3500, format='JPEG', has_transparency=False)
        
        design_data = {
            "title": "TEST_JPEG Format Design",
            "description": "Testing JPEG format needing conversion",
            "image_url": image_url,
            "analysis": {
                "width": 3500,
                "height": 3500,
                "hasTransparency": False,
                "colorCount": 3,
                "hasGradients": False,
                "quality": "acceptable",
                "adminFlags": ["format_conversion_needed", "background_cleanup_required"]
            },
            "products": [
                {"productType": "tshirt", "color": "white", "preset": "tshirt", "printMethod": "dtf", "basePrice": 799}
            ]
        }
        
        response = requests.post(f"{BASE_URL}/api/designs", json=design_data, headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        admin_flags = data.get("design_analysis", {}).get("adminFlags", [])
        assert "format_conversion_needed" in admin_flags
        print("PASS: Design with format_conversion_needed flag stored")
        
        # Cleanup
        design_id = data.get("design_id")
        if design_id:
            requests.delete(f"{BASE_URL}/api/designs/{design_id}", headers=self.headers)
    
    def test_create_design_with_background_cleanup(self):
        """Test design creation with non-transparent background needing cleanup"""
        image_url = self.create_test_image_base64(3500, 3500, has_transparency=False)
        
        design_data = {
            "title": "TEST_Background Cleanup Design",
            "description": "Testing design without transparency",
            "image_url": image_url,
            "analysis": {
                "width": 3500,
                "height": 3500,
                "hasTransparency": False,
                "hasCleanBackground": True,
                "colorCount": 3,
                "hasGradients": False,
                "quality": "acceptable",
                "adminFlags": ["background_cleanup_recommended"]
            },
            "products": [
                {"productType": "tshirt", "color": "white", "preset": "tshirt", "printMethod": "dtf", "basePrice": 799}
            ]
        }
        
        response = requests.post(f"{BASE_URL}/api/designs", json=design_data, headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        admin_flags = data.get("design_analysis", {}).get("adminFlags", [])
        assert "background_cleanup_recommended" in admin_flags
        print("PASS: Design with background_cleanup_recommended flag stored")
        
        # Cleanup
        design_id = data.get("design_id")
        if design_id:
            requests.delete(f"{BASE_URL}/api/designs/{design_id}", headers=self.headers)
    
    def test_create_design_with_embroidery_warning(self):
        """Test design creation with 5 colors (embroidery soft warning)"""
        image_url = self.create_test_image_base64(3500, 3500)
        
        design_data = {
            "title": "TEST_Embroidery Warning Design",
            "description": "Testing 5 colors design with embroidery soft warning",
            "image_url": image_url,
            "analysis": {
                "width": 3500,
                "height": 3500,
                "hasTransparency": True,
                "colorCount": 5,  # Between soft limit (4) and hard limit (6)
                "hasGradients": False,
                "quality": "acceptable",
                "adminFlags": ["embroidery_not_recommended"]
            },
            "products": [
                {"productType": "tshirt", "color": "white", "preset": "tshirt", "printMethod": "dtf", "basePrice": 799},
                {"productType": "varsity_jacket", "color": "black", "preset": "varsity_jacket", "printMethod": "embroidery", "basePrice": 2499}
            ]
        }
        
        response = requests.post(f"{BASE_URL}/api/designs", json=design_data, headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        admin_flags = data.get("design_analysis", {}).get("adminFlags", [])
        assert "embroidery_not_recommended" in admin_flags
        print("PASS: Design with embroidery_not_recommended flag stored")
        
        # Cleanup
        design_id = data.get("design_id")
        if design_id:
            requests.delete(f"{BASE_URL}/api/designs/{design_id}", headers=self.headers)
    
    def test_create_design_with_multiple_admin_flags(self):
        """Test design creation with multiple quality issues"""
        image_url = self.create_test_image_base64(2000, 2000, format='JPEG', has_transparency=False)
        
        design_data = {
            "title": "TEST_Multiple Issues Design",
            "description": "Testing design with multiple quality issues",
            "image_url": image_url,
            "analysis": {
                "width": 2000,
                "height": 2000,
                "hasTransparency": False,
                "colorCount": 5,
                "hasGradients": False,
                "quality": "needs_optimization",
                "adminFlags": [
                    "low_resolution",
                    "format_conversion_needed",
                    "background_cleanup_required",
                    "embroidery_not_recommended"
                ]
            },
            "products": [
                {"productType": "tshirt", "color": "white", "preset": "tshirt", "printMethod": "dtf", "basePrice": 799}
            ]
        }
        
        response = requests.post(f"{BASE_URL}/api/designs", json=design_data, headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        admin_flags = data.get("design_analysis", {}).get("adminFlags", [])
        assert len(admin_flags) >= 3
        print(f"PASS: Design with multiple admin flags stored: {admin_flags}")
        
        # Cleanup
        design_id = data.get("design_id")
        if design_id:
            requests.delete(f"{BASE_URL}/api/designs/{design_id}", headers=self.headers)
    
    def test_design_analysis_stored_correctly(self):
        """Verify design_analysis is stored and retrievable"""
        image_url = self.create_test_image_base64(3500, 3500)
        
        analysis = {
            "width": 3500,
            "height": 3500,
            "hasTransparency": True,
            "colorCount": 3,
            "hasGradients": False,
            "quality": "acceptable",
            "adminFlags": ["test_flag"]
        }
        
        design_data = {
            "title": "TEST_Analysis Storage Design",
            "description": "Testing design_analysis storage",
            "image_url": image_url,
            "analysis": analysis,
            "products": [
                {"productType": "tshirt", "color": "white", "preset": "tshirt", "printMethod": "dtf", "basePrice": 799}
            ]
        }
        
        # Create design
        response = requests.post(f"{BASE_URL}/api/designs", json=design_data, headers=self.headers)
        assert response.status_code == 200
        created_design = response.json()
        design_id = created_design.get("design_id")
        
        # Retrieve design
        get_response = requests.get(f"{BASE_URL}/api/designs/{design_id}", headers=self.headers)
        assert get_response.status_code == 200
        retrieved_design = get_response.json()
        
        # Verify analysis is stored
        stored_analysis = retrieved_design.get("design_analysis", {})
        assert stored_analysis.get("width") == 3500
        assert stored_analysis.get("height") == 3500
        assert stored_analysis.get("quality") == "acceptable"
        assert "test_flag" in stored_analysis.get("adminFlags", [])
        print("PASS: design_analysis stored and retrieved correctly")
        
        # Cleanup
        if design_id:
            requests.delete(f"{BASE_URL}/api/designs/{design_id}", headers=self.headers)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
