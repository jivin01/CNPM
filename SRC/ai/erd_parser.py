"""
ERD Parser Engine - Phân tích diagram ERD thành cấu trúc dữ liệu
Hỗ trợ các định dạng: PNG, JPG, SVG của ERD diagrams
"""
import cv2
import numpy as np
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import re

@dataclass
class Entity:
    """Đại diện cho một entity trong ERD"""
    name: str
    attributes: List[str]
    primary_keys: List[str]
    foreign_keys: List[str]
    position: Tuple[int, int]  # (x, y) coordinates

@dataclass 
class Relationship:
    """Đại diện cho mối quan hệ trong ERD"""
    entity1: str
    entity2: str
    cardinality: str  # "1:1", "1:N", "N:M", etc.
    relationship_type: str  # "identifying", "non-identifying"

@dataclass
class ERDResult:
    """Kết quả phân tích ERD"""
    entities: List[Entity]
    relationships: List[Relationship]
    confidence: float

class ERDParser:
    """Parser để phân tích ERD diagrams"""
    
    def __init__(self):
        self.entity_patterns = [
            r'([A-Z][a-zA-Z_]+)',  # Entity names
            r'PK:\s*(\w+)',         # Primary keys
            r'FK:\s*(\w+)',         # Foreign keys
        ]
    
    def parse_from_image(self, image_path: str) -> ERDResult:
        """Phân tích ERD từ file ảnh"""
        try:
            # Đọc và xử lý ảnh
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError(f"Không thể đọc ảnh: {image_path}")
            
            # Chuyển đổi sang grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Phát hiện text blocks (sử dụng OCR hoặc contour detection)
            entities = self._extract_entities(gray)
            relationships = self._extract_relationships(gray)
            
            return ERDResult(
                entities=entities,
                relationships=relationships,
                confidence=0.8  # Placeholder confidence score
            )
            
        except Exception as e:
            raise RuntimeError(f"Lỗi khi phân tích ERD: {str(e)}")
    
    def _extract_entities(self, gray_image: np.ndarray) -> List[Entity]:
        """Trích xuất entities từ ảnh"""
        entities = []
        
        # Simple contour detection để tìm boxes
        contours, _ = cv2.findContours(gray_image, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in contours:
            # Lấy bounding box
            x, y, w, h = cv2.boundingRect(contour)
            
            # Filter nhỏ boxes
            if w < 50 or h < 20:
                continue
            
            # Extract text region (placeholder - cần OCR thực tế)
            entity_region = gray_image[y:y+h, x:x+w]
            
            # Mock entity extraction (cần OCR library như Tesseract)
            entity_name = f"Entity_{len(entities)+1}"
            attributes = [f"attr_{i}" for i in range(3)]
            primary_keys = ["id"]
            foreign_keys = []
            
            entity = Entity(
                name=entity_name,
                attributes=attributes,
                primary_keys=primary_keys,
                foreign_keys=foreign_keys,
                position=(x, y)
            )
            entities.append(entity)
        
        return entities
    
    def _extract_relationships(self, gray_image: np.ndarray) -> List[Relationship]:
        """Trích xuất relationships từ ảnh"""
        relationships = []
        
        # Placeholder implementation
        # Cần phát hiện lines và arrows giữa entities
        
        return relationships
    
    def parse_from_text(self, erd_text: str) -> ERDResult:
        """Phân tích ERD từ text description"""
        entities = []
        relationships = []
        
        # Parse entities từ text
        entity_matches = re.findall(r'Entity:\s*(\w+)\s*\{([^}]+)\}', erd_text)
        
        for match in entity_matches:
            entity_name = match[0]
            attributes_text = match[1]
            
            # Parse attributes
            attributes = re.findall(r'(\w+):\s*\w+', attributes_text)
            primary_keys = re.findall(r'PK:\s*(\w+)', attributes_text)
            foreign_keys = re.findall(r'FK:\s*(\w+)', attributes_text)
            
            entity = Entity(
                name=entity_name,
                attributes=attributes,
                primary_keys=primary_keys,
                foreign_keys=foreign_keys,
                position=(0, 0)
            )
            entities.append(entity)
        
        # Parse relationships
        rel_matches = re.findall(r'(\w+)\s*-\[(\w+)\]->\s*(\w+)', erd_text)
        for match in rel_matches:
            entity1, cardinality, entity2 = match
            relationship = Relationship(
                entity1=entity1,
                entity2=entity2,
                cardinality=cardinality,
                relationship_type="non-identifying"
            )
            relationships.append(relationship)
        
        return ERDResult(
            entities=entities,
            relationships=relationships,
            confidence=0.9
        )
