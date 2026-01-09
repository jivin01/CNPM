"""
ERD Parser Engine - Phân tích diagram ERD thành cấu trúc dữ liệu
Hỗ trợ các định dạng: PNG, JPG, SVG của ERD diagrams
"""
import cv2
import numpy as np
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import re
import json
import os
import logging

try:
    import requests  # type: ignore
except Exception:
    requests = None

@dataclass
class Entity:
    """Đại diện cho một entity trong ERD"""
    name: str
    attributes: List[str]
    primary_keys: List[str]
    foreign_keys: List[str]
    position: Tuple[int, int]  # (x, y) coordinates
    bbox: Optional[Tuple[int, int, int, int]] = None  # (x, y, w, h)

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
            entities = self._extract_entities(gray, image)
            relationships = self._extract_relationships(gray, entities)
            
            return ERDResult(
                entities=entities,
                relationships=relationships,
                confidence=0.8  # Placeholder confidence score
            )
            
        except Exception as e:
            raise RuntimeError(f"Lỗi khi phân tích ERD: {str(e)}")
    
    def _extract_entities(self, gray_image: np.ndarray, color_image: np.ndarray) -> List[Entity]:
        """Trích xuất entities từ ảnh, cố gắng dùng OCR nếu có pytesseract"""
        entities: List[Entity] = []

        # Binarize and invert to make text/boxes more prominent
        try:
            thresh = cv2.adaptiveThreshold(gray_image, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                           cv2.THRESH_BINARY_INV, 15, 8)
        except Exception:
            _, thresh = cv2.threshold(gray_image, 127, 255, cv2.THRESH_BINARY_INV)

        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        # Try to import pytesseract but continue if not available
        ocr_available = False
        try:
            import pytesseract  # type: ignore
            ocr_available = True
        except Exception:
            ocr_available = False

        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)

            # Filter small boxes
            if w < 40 or h < 18:
                continue

            # Expand a little to catch text near borders
            pad = 4
            x0 = max(0, x - pad)
            y0 = max(0, y - pad)
            x1 = min(color_image.shape[1], x + w + pad)
            y1 = min(color_image.shape[0], y + h + pad)

            entity_region_color = color_image[y0:y1, x0:x1]
            entity_region_gray = gray_image[y0:y1, x0:x1]

            entity_name = f"Entity_{len(entities)+1}"
            attributes: List[str] = []
            primary_keys: List[str] = []
            foreign_keys: List[str] = []

            if ocr_available:
                try:
                    # prefer OCR on color region
                    raw = pytesseract.image_to_string(entity_region_color, config='--psm 6')
                    raw = raw.strip()
                    if raw:
                        # Split lines, first non-empty token is likely the entity name
                        lines = [ln.strip() for ln in raw.splitlines() if ln.strip()]
                        if lines:
                            # Attempt to find entity name using pattern
                            for ln in lines:
                                m = re.search(self.entity_patterns[0], ln)
                                if m:
                                    entity_name = m.group(1)
                                    break
                            # Treat remaining lines as attributes
                            for ln in lines[1:]:
                                # find PK/FK markers
                                pk = re.findall(r'PK[:\s]+(\w+)', ln)
                                fk = re.findall(r'FK[:\s]+(\w+)', ln)
                                if pk:
                                    primary_keys.extend(pk)
                                if fk:
                                    foreign_keys.extend(fk)
                                # generic attribute name
                                attr_match = re.findall(r'(\w+)', ln)
                                if attr_match:
                                    attributes.append(attr_match[0])
                except Exception:
                    # OCR failed, fallback to defaults
                    pass

            if not attributes:
                attributes = [f"attr_{i}" for i in range(3)]
            if not primary_keys:
                primary_keys = ["id"]

            entity = Entity(
                name=entity_name,
                attributes=attributes,
                primary_keys=primary_keys,
                foreign_keys=foreign_keys,
                position=(x + w // 2, y + h // 2),
                bbox=(x, y, w, h)
            )
            entities.append(entity)

        # sort entities by position for determinism
        entities.sort(key=lambda e: (e.position[1], e.position[0]))
        return entities

    # --- New helpers: annotation, export, upload, notify ---
    def save_annotated_image(self, src_image_path: str, dest_path: str, entities: List[Entity], relationships: List[Relationship]) -> str:
        """Vẽ bounding box cho entities và đường cho relationships rồi lưu ảnh annotated.
        Trả về đường dẫn file đã lưu.
        """
        img = cv2.imread(src_image_path)
        if img is None:
            raise ValueError(f"Không thể đọc ảnh: {src_image_path}")

        # draw entities
        for e in entities:
            if e.bbox:
                x, y, w, h = e.bbox
                cv2.rectangle(img, (x, y), (x + w, y + h), (0, 255, 0), 2)
                cv2.putText(img, e.name, (x, max(0, y - 6)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)

        # draw relationships as lines between entity centers
        name_to_entity = {e.name: e for e in entities}
        for r in relationships:
            e1 = name_to_entity.get(r.entity1)
            e2 = name_to_entity.get(r.entity2)
            if e1 and e2:
                cv2.line(img, e1.position, e2.position, (255, 0, 0), 2)
                mx = (e1.position[0] + e2.position[0]) // 2
                my = (e1.position[1] + e2.position[1]) // 2
                cv2.putText(img, r.cardinality or "", (mx, my), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 0, 0), 1)

        os.makedirs(os.path.dirname(dest_path) or '.', exist_ok=True)
        cv2.imwrite(dest_path, img)
        return dest_path

    def export_results_json(self, result: ERDResult, dest_path: str) -> str:
        """Xuất kết quả phân tích ra JSON file."""
        payload = {
            "confidence": result.confidence,
            "entities": [
                {
                    "name": e.name,
                    "attributes": e.attributes,
                    "primary_keys": e.primary_keys,
                    "foreign_keys": e.foreign_keys,
                    "position": e.position,
                    "bbox": e.bbox,
                }
                for e in result.entities
            ],
            "relationships": [
                {
                    "entity1": r.entity1,
                    "entity2": r.entity2,
                    "cardinality": r.cardinality,
                    "relationship_type": r.relationship_type,
                }
                for r in result.relationships
            ]
        }
        os.makedirs(os.path.dirname(dest_path) or '.', exist_ok=True)
        with open(dest_path, 'w', encoding='utf-8') as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
        return dest_path

    def upload_to_storage(self, file_path: str, provider: str = 'cloudinary', config: Optional[Dict] = None) -> Optional[str]:
        """Placeholder: upload file to Cloudinary or Supabase.
        If required environment variables/config provided, attempt upload and return public URL.
        Otherwise returns None.
        """
        logging.info(f"Upload {file_path} to {provider}")
        cfg = config or {}
        if provider == 'cloudinary':
            # prefer explicit cloud_name + upload_preset or upload_url
            cloud_name = cfg.get('cloud_name') or os.getenv('CLOUDINARY_CLOUD_NAME')
            upload_preset = cfg.get('upload_preset') or os.getenv('CLOUDINARY_UPLOAD_PRESET')
            upload_url = cfg.get('upload_url') or os.getenv('CLOUDINARY_UPLOAD_URL')

            # If explicit upload_url provided, use it. Otherwise construct API URL and use upload_preset.
            if upload_url:
                url = upload_url
            elif cloud_name:
                url = f'https://api.cloudinary.com/v1_1/{cloud_name}/image/upload'
            else:
                logging.warning('Cloudinary config not found')
                return None

            if requests is None:
                logging.warning('requests not available for upload')
                return None

            data = {}
            if upload_preset:
                data['upload_preset'] = upload_preset

            # allow destination filename/path
            public_id = cfg.get('public_id')
            if public_id:
                data['public_id'] = public_id

            with open(file_path, 'rb') as fh:
                files = {'file': fh}
                try:
                    resp = requests.post(url, data=data, files=files, timeout=60)
                    if resp.status_code in (200, 201):
                        data = resp.json()
                        return data.get('secure_url') or data.get('url')
                    logging.warning('Cloudinary upload failed status=%s text=%s', resp.status_code, resp.text)
                except Exception:
                    logging.exception('Upload failed')
                    return None
        if provider == 'supabase':
            # expects SUPABASE_URL and SUPABASE_KEY or provided in config
            supabase_url = cfg.get('supabase_url') or os.getenv('SUPABASE_URL')
            supabase_key = cfg.get('supabase_key') or os.getenv('SUPABASE_KEY')
            bucket = cfg.get('bucket') or os.getenv('SUPABASE_BUCKET') or 'public'
            dest_path = cfg.get('path') or os.path.basename(file_path)

            if not supabase_url or not supabase_key or requests is None:
                logging.warning('Supabase config missing or requests not available')
                return None

            upload_endpoint = f"{supabase_url}/storage/v1/object/{bucket}/{dest_path}"
            headers = {
                'Authorization': f'Bearer {supabase_key}',
            }
            # x-upsert true to overwrite
            headers['x-upsert'] = 'true'

            with open(file_path, 'rb') as fh:
                try:
                    resp = requests.put(upload_endpoint, data=fh, headers=headers, timeout=60)
                    if resp.status_code in (200, 201):
                        # public URL for object
                        public_url = f"{supabase_url}/storage/v1/object/public/{bucket}/{dest_path}"
                        return public_url
                    logging.warning('Supabase upload failed status=%s text=%s', resp.status_code, resp.text)
                except Exception:
                    logging.exception('Supabase upload failed')
                    return None

        logging.warning('Provider not implemented')
        return None

    def notify_via_webhook(self, webhook_url: str, payload: Dict) -> bool:
        """Gửi thông báo kết quả tới webhook (có thể dùng cho SignalR/ChatHub hoặc gửi tới backend)."""
        if requests is None:
            logging.warning('requests not available for webhook')
            return False
        try:
            resp = requests.post(webhook_url, json=payload, timeout=10)
            return resp.status_code >= 200 and resp.status_code < 300
        except Exception:
            logging.exception('Webhook notify failed')
            return False

    def process_image_and_export(self, image_path: str, out_image_path: str, out_json_path: str, upload: bool = False, upload_config: Optional[Dict] = None, webhook: Optional[str] = None) -> ERDResult:
        """Tiện ích bọc: phân tích ảnh, lưu annotated image và JSON, tùy chọn upload + notify."""
        result = self.parse_from_image(image_path)
        # save annotated image
        try:
            self.save_annotated_image(image_path, out_image_path, result.entities, result.relationships)
        except Exception:
            logging.exception('Failed to save annotated image')
        # save json
        try:
            self.export_results_json(result, out_json_path)
        except Exception:
            logging.exception('Failed to save json results')

        uploaded_url = None
        if upload:
            uploaded_url = self.upload_to_storage(out_image_path, provider=(upload_config or {}).get('provider', 'cloudinary'), config=upload_config)

        if webhook:
            payload = {
                'image': uploaded_url,
                'json': out_json_path,
                'confidence': result.confidence,
            }
            try:
                self.notify_via_webhook(webhook, payload)
            except Exception:
                logging.exception('Notify webhook failed')

        return result
    
    def _extract_relationships(self, gray_image: np.ndarray, entities: List[Entity]) -> List[Relationship]:
        """Trích xuất relationships đơn giản bằng cách dò cạnh và nối 2 thực thể gần nhất"""
        relationships: List[Relationship] = []

        if not entities:
            return relationships

        # Edge detection
        edges = cv2.Canny(gray_image, 50, 150)

        # Hough line detection
        lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=50, minLineLength=30, maxLineGap=10)
        pairs = set()

        def nearest_entity(pt):
            x, y = pt
            best = None
            best_d = None
            for e in entities:
                ex, ey = e.position
                d = (ex - x) ** 2 + (ey - y) ** 2
                if best is None or d < best_d:
                    best = e
                    best_d = d
            return best

        if lines is None:
            return relationships

        for l in lines:
            x1, y1, x2, y2 = l[0]
            e1 = nearest_entity((x1, y1))
            e2 = nearest_entity((x2, y2))
            if e1 is None or e2 is None or e1.name == e2.name:
                continue
            key = tuple(sorted([e1.name, e2.name]))
            if key in pairs:
                continue
            pairs.add(key)
            rel = Relationship(
                entity1=e1.name,
                entity2=e2.name,
                cardinality="unknown",
                relationship_type="non-identifying"
            )
            relationships.append(rel)

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
