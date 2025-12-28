"""
Tests for ERD Processing functionality
"""
import pytest
import tempfile
import os
from pathlib import Path
import sys

# Add project root to path for imports
BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from ai.erd_parser import ERDParser, Entity, Relationship, ERDResult
from ai.model_generator import ModelGenerator
from ai.database_generator import DatabaseGenerator

class TestERDParser:
    """Test ERD Parser functionality"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.parser = ERDParser()
    
    def test_parse_from_text_simple(self):
        """Test parsing simple ERD from text"""
        erd_text = """
        Entity: User {id: int, name: str, email: str, PK: id}
        Entity: Post {id: int, title: str, user_id: int, PK: id, FK: user_id}
        User -[1:N]-> Post
        """
        
        result = self.parser.parse_from_text(erd_text)
        
        assert len(result.entities) == 2
        assert len(result.relationships) == 1
        assert result.confidence > 0.8
        
        # Check User entity
        user_entity = next(e for e in result.entities if e.name == "User")
        assert "id" in user_entity.primary_keys
        assert "name" in user_entity.attributes
        assert "email" in user_entity.attributes
        
        # Check Post entity
        post_entity = next(e for e in result.entities if e.name == "Post")
        assert "id" in post_entity.primary_keys
        assert "user_id" in post_entity.foreign_keys
    
    def test_parse_empty_text(self):
        """Test parsing empty text"""
        result = self.parser.parse_from_text("")
        assert len(result.entities) == 0
        assert len(result.relationships) == 0
        assert result.confidence == 0.9

class TestModelGenerator:
    """Test Model Generator functionality"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.generator = ModelGenerator()
        
        # Create sample ERD result
        self.sample_erd = ERDResult(
            entities=[
                Entity(
                    name="User",
                    attributes=["id", "name", "email", "created_at"],
                    primary_keys=["id"],
                    foreign_keys=[],
                    position=(0, 0)
                ),
                Entity(
                    name="Post",
                    attributes=["id", "title", "content", "user_id", "created_at"],
                    primary_keys=["id"],
                    foreign_keys=["user_id"],
                    position=(100, 0)
                )
            ],
            relationships=[
                Relationship(
                    entity1="User",
                    entity2="Post", 
                    cardinality="1:N",
                    relationship_type="non-identifying"
                )
            ],
            confidence=0.9
        )
    
    def test_generate_models_code(self):
        """Test generating SQLModel code"""
        models_code = self.generator.generate_models(self.sample_erd)
        
        assert "class User(SQLModel, table=True):" in models_code
        assert "class Post(SQLModel, table=True):" in models_code
        assert "id: Optional[int] = Field(default=None, primary_key=True)" in models_code
        assert "user_id: int = Field(foreign_key=\"user.id\")" in models_code
        assert "created_at: datetime = Field(default_factory=datetime.utcnow)" in models_code
    
    def test_save_models_file(self):
        """Test saving models to file"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            temp_path = f.name
        
        try:
            saved_path = self.generator.save_models_file(self.sample_erd, temp_path)
            
            assert os.path.exists(saved_path)
            assert saved_path == temp_path
            
            # Read and verify content
            with open(temp_path, 'r') as f:
                content = f.read()
            
            assert "class User" in content
            assert "class Post" in content
            
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)

class TestDatabaseGenerator:
    """Test Database Generator functionality"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.generator = DatabaseGenerator()
        
        # Create sample ERD result
        self.sample_erd = ERDResult(
            entities=[
                Entity(
                    name="User",
                    attributes=["id", "name", "email"],
                    primary_keys=["id"],
                    foreign_keys=[],
                    position=(0, 0)
                )
            ],
            relationships=[],
            confidence=0.9
        )
    
    def test_generate_sql_schema(self):
        """Test generating SQL database schema"""
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
            temp_db_path = f.name
        
        try:
            generated_path = self.generator.generate_sql_schema(self.sample_erd, temp_db_path)
            
            assert os.path.exists(generated_path)
            assert generated_path == temp_db_path
            
            # Verify database structure
            import sqlite3
            conn = sqlite3.connect(temp_db_path)
            cursor = conn.cursor()
            
            # Check if User table exists
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='user';")
            tables = cursor.fetchall()
            assert len(tables) == 1
            assert tables[0][0] == "user"
            
            # Check table structure
            cursor.execute("PRAGMA table_info(user);")
            columns = cursor.fetchall()
            column_names = [col[1] for col in columns]
            
            assert "id" in column_names
            assert "name" in column_names
            assert "email" in column_names
            assert "created_at" in column_names
            
            conn.close()
            
        finally:
            if os.path.exists(temp_db_path):
                os.unlink(temp_db_path)
    
    def test_generate_migration_script(self):
        """Test generating migration script"""
        migration_script = self.generator.generate_migration_script(self.sample_erd)
        
        assert "DROP TABLE IF EXISTS user;" in migration_script
        assert "CREATE TABLE user (" in migration_script
        assert "id INTEGER PRIMARY KEY AUTOINCREMENT" in migration_script
        assert "created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP" in migration_script

class TestIntegration:
    """Integration tests for ERD processing pipeline"""
    
    def test_full_pipeline(self):
        """Test complete ERD processing pipeline"""
        # 1. Parse ERD from text
        parser = ERDParser()
        erd_text = """
        Entity: Category {id: int, name: str, PK: id}
        Entity: Product {id: int, name: str, price: float, category_id: int, PK: id, FK: category_id}
        Category -[1:N]-> Product
        """
        
        erd_result = parser.parse_from_text(erd_text)
        assert len(erd_result.entities) == 2
        assert len(erd_result.relationships) == 1
        
        # 2. Generate models
        model_generator = ModelGenerator()
        models_code = model_generator.generate_models(erd_result)
        assert "class Category" in models_code
        assert "class Product" in models_code
        
        # 3. Generate database
        db_generator = DatabaseGenerator()
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
            temp_db_path = f.name
        
        try:
            db_path = db_generator.generate_sql_schema(erd_result, temp_db_path)
            assert os.path.exists(db_path)
            
            # Verify database
            import sqlite3
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = [table[0] for table in cursor.fetchall()]
            assert "category" in tables
            assert "product" in tables
            
            conn.close()
            
        finally:
            if os.path.exists(temp_db_path):
                os.unlink(temp_db_path)

if __name__ == "__main__":
    pytest.main([__file__])
