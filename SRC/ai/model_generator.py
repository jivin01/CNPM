"""
Model Generator - Tạo SQLModel entities từ ERD analysis
"""
from typing import List, Dict, Optional
from sqlmodel import SQLModel, Field
from datetime import datetime
from .erd_parser import Entity, Relationship, ERDResult
import re

class ModelGenerator:
    """Generator để tạo SQLModel code từ ERD"""
    
    def __init__(self):
        self.python_types = {
            'string': 'str',
            'text': 'str', 
            'integer': 'int',
            'number': 'int',
            'decimal': 'float',
            'float': 'float',
            'double': 'float',
            'boolean': 'bool',
            'date': 'datetime',
            'datetime': 'datetime',
            'timestamp': 'datetime'
        }
    
    def generate_models(self, erd_result: ERDResult) -> str:
        """Tạo SQLModel code từ ERD result"""
        model_code = []
        
        # Add imports
        imports = self._generate_imports(erd_result)
        model_code.append(imports)
        
        # Generate each entity model
        for entity in erd_result.entities:
            model_class = self._generate_entity_model(entity)
            model_code.append(model_class)
        
        # Generate relationship models if needed
        for relationship in erd_result.relationships:
            if relationship.cardinality == "N:M":
                rel_model = self._generate_relationship_model(relationship)
                model_code.append(rel_model)
        
        return "\n\n".join(model_code)
    
    def _generate_imports(self, erd_result: ERDResult) -> str:
        """Tạo import statements"""
        imports = [
            "from typing import Optional",
            "from sqlmodel import SQLModel, Field, Relationship",
            "from datetime import datetime"
        ]
        
        # Check if datetime is needed
        has_datetime = any(
            any('date' in attr.lower() or 'time' in attr.lower() for attr in entity.attributes)
            for entity in erd_result.entities
        )
        
        return "\n".join(imports)
    
    def _generate_entity_model(self, entity: Entity) -> str:
        """Tạo SQLModel class cho một entity"""
        class_lines = []
        
        # Class definition
        class_name = self._to_pascal_case(entity.name)
        class_lines.append(f"class {class_name}(SQLModel, table=True):")
        class_lines.append(f'    """{entity.name} model"""')
        
        # ID field
        class_lines.append("    id: Optional[int] = Field(default=None, primary_key=True)")
        
        # Generate fields from attributes
        for attr in entity.attributes:
            if attr not in entity.primary_keys and attr != 'id':
                field_def = self._generate_field(attr, entity)
                class_lines.append(field_def)
        
        # Foreign key relationships
        for fk in entity.foreign_keys:
            fk_field = self._generate_foreign_key_field(fk, entity)
            class_lines.append(fk_field)
        
        # Relationship fields
        for fk in entity.foreign_keys:
            rel_field = self._generate_relationship_field(fk, entity)
            class_lines.append(rel_field)
        
        # Timestamps
        class_lines.append("    created_at: datetime = Field(default_factory=datetime.utcnow)")
        class_lines.append("    updated_at: Optional[datetime] = None")
        
        return "\n".join(class_lines)
    
    def _generate_field(self, attr_name: str, entity: Entity) -> str:
        """Tạo field definition cho attribute"""
        # Detect data type from attribute name
        data_type = self._infer_data_type(attr_name)
        nullable = attr_name not in entity.primary_keys
        
        if nullable:
            return f"    {attr_name}: Optional[{data_type}] = None"
        else:
            return f"    {attr_name}: {data_type}"
    
    def _infer_data_type(self, attr_name: str) -> str:
        """Suy luận data type từ tên attribute"""
        attr_lower = attr_name.lower()
        
        if any(keyword in attr_lower for keyword in ['id', 'count', 'num', 'quantity']):
            return 'int'
        elif any(keyword in attr_lower for keyword in ['price', 'amount', 'rate', 'percent']):
            return 'float'
        elif any(keyword in attr_lower for keyword in ['date', 'time', 'created', 'updated']):
            return 'datetime'
        elif any(keyword in attr_lower for keyword in ['is_', 'has_', 'can_', 'flag']):
            return 'bool'
        else:
            return 'str'
    
    def _generate_foreign_key_field(self, fk: str, entity: Entity) -> str:
        """Tạo foreign key field"""
        fk_entity_name = fk.replace('_id', '').replace('Id', '')
        return f"    {fk}: int = Field(foreign_key=\"{fk_entity_name.lower()}.id\")"
    
    def _generate_relationship_field(self, fk: str, entity: Entity) -> str:
        """Tạo relationship field"""
        fk_entity_name = fk.replace('_id', '').replace('Id', '')
        fk_entity_class = self._to_pascal_case(fk_entity_name)
        entity_class = self._to_pascal_case(entity.name)
        
        return f"    {fk_entity_class.lower()}: Optional[\"{fk_entity_class}\"] = Relationship(back_populates=\"{entity_class.lower()}\")"
    
    def _generate_relationship_model(self, relationship: Relationship) -> str:
        """Tạo model cho many-to-many relationship"""
        entity1_class = self._to_pascal_case(relationship.entity1)
        entity2_class = self._to_pascal_case(relationship.entity2)
        table_name = f"{relationship.entity1.lower()}_{relationship.entity2.lower()}"
        
        class_lines = []
        class_lines.append(f"class {entity1_class}{entity2_class}(SQLModel, table=True):")
        class_lines.append(f'    """{relationship.entity1} {relationship.entity2} relationship"""')
        class_lines.append(f"    {relationship.entity1.lower()}_id: int = Field(foreign_key=\"{relationship.entity1.lower()}.id\")")
        class_lines.append(f"    {relationship.entity2.lower()}_id: int = Field(foreign_key=\"{relationship.entity2.lower()}.id\")")
        
        return "\n".join(class_lines)
    
    def _to_pascal_case(self, snake_str: str) -> str:
        """Chuyển snake_case sang PascalCase"""
        components = snake_str.split('_')
        return ''.join(x.capitalize() for x in components)
    
    def save_models_file(self, erd_result: ERDResult, output_path: str):
        """Lưu models vào file"""
        model_code = self.generate_models(erd_result)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(model_code)
        
        return output_path
