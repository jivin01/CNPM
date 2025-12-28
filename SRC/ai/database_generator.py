"""
Database Schema Generator - Tạo database schema từ ERD
"""
from typing import List, Dict, Optional
from .erd_parser import Entity, Relationship, ERDResult
import sqlite3
import os

class DatabaseGenerator:
    """Generator để tạo database schema từ ERD"""
    
    def __init__(self):
        self.sqlite_types = {
            'str': 'TEXT',
            'int': 'INTEGER', 
            'float': 'REAL',
            'bool': 'INTEGER',
            'datetime': 'TEXT'
        }
    
    def generate_sql_schema(self, erd_result: ERDResult, db_path: str = "generated_database.db") -> str:
        """Tạo database schema SQL từ ERD result"""
        
        # Remove existing database if exists
        if os.path.exists(db_path):
            os.remove(db_path)
        
        # Create database connection
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        try:
            # Create tables for entities
            for entity in erd_result.entities:
                self._create_entity_table(cursor, entity)
            
            # Create junction tables for many-to-many relationships
            for relationship in erd_result.relationships:
                if relationship.cardinality == "N:M":
                    self._create_junction_table(cursor, relationship)
            
            # Create indexes
            self._create_indexes(cursor, erd_result)
            
            conn.commit()
            return db_path
            
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
    
    def _create_entity_table(self, cursor, entity: Entity):
        """Tạo table cho entity"""
        table_name = entity.name.lower()
        
        # Build CREATE TABLE statement
        columns = []
        
        # Primary key
        columns.append("id INTEGER PRIMARY KEY AUTOINCREMENT")
        
        # Entity attributes
        for attr in entity.attributes:
            if attr != 'id':
                sql_type = self._get_sql_type(attr)
                nullable = "NULL" if attr not in entity.primary_keys else "NOT NULL"
                columns.append(f"{attr} {sql_type} {nullable}")
        
        # Foreign keys
        for fk in entity.foreign_keys:
            ref_table = fk.replace('_id', '').lower()
            columns.append(f"{fk} INTEGER NOT NULL")
            columns.append(f"FOREIGN KEY ({fk}) REFERENCES {ref_table}(id)")
        
        # Timestamps
        columns.append("created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP")
        columns.append("updated_at TEXT NULL")
        
        # Create table
        create_sql = f"""
        CREATE TABLE IF NOT EXISTS {table_name} (
            {', '.join(columns)}
        )
        """
        cursor.execute(create_sql)
    
    def _create_junction_table(self, cursor, relationship: Relationship):
        """Tạo junction table cho many-to-many relationship"""
        table_name = f"{relationship.entity1.lower()}_{relationship.entity2.lower()}"
        
        create_sql = f"""
        CREATE TABLE IF NOT EXISTS {table_name} (
            {relationship.entity1.lower()}_id INTEGER NOT NULL,
            {relationship.entity2.lower()}_id INTEGER NOT NULL,
            PRIMARY KEY ({relationship.entity1.lower()}_id, {relationship.entity2.lower()}_id),
            FOREIGN KEY ({relationship.entity1.lower()}_id) REFERENCES {relationship.entity1.lower()}(id),
            FOREIGN KEY ({relationship.entity2.lower()}_id) REFERENCES {relationship.entity2.lower()}(id)
        )
        """
        cursor.execute(create_sql)
    
    def _create_indexes(self, cursor, erd_result: ERDResult):
        """Tạo indexes cho performance"""
        for entity in erd_result.entities:
            table_name = entity.name.lower()
            
            # Index for foreign keys
            for fk in entity.foreign_keys:
                index_name = f"idx_{table_name}_{fk}"
                cursor.execute(f"CREATE INDEX IF NOT EXISTS {index_name} ON {table_name}({fk})")
            
            # Index for commonly searched fields
            for attr in entity.attributes:
                if any(keyword in attr.lower() for keyword in ['name', 'email', 'code', 'status']):
                    index_name = f"idx_{table_name}_{attr}"
                    cursor.execute(f"CREATE INDEX IF NOT EXISTS {index_name} ON {table_name}({attr})")
    
    def _get_sql_type(self, attr_name: str) -> str:
        """Lấy SQL data type từ attribute name"""
        attr_lower = attr_name.lower()
        
        if any(keyword in attr_lower for keyword in ['id', 'count', 'num', 'quantity']):
            return 'INTEGER'
        elif any(keyword in attr_lower for keyword in ['price', 'amount', 'rate', 'percent']):
            return 'REAL'
        elif any(keyword in attr_lower for keyword in ['is_', 'has_', 'can_', 'flag']):
            return 'INTEGER'  # SQLite doesn't have BOOLEAN
        else:
            return 'TEXT'
    
    def generate_migration_script(self, erd_result: ERDResult) -> str:
        """Tạo migration script SQL"""
        migrations = []
        
        migrations.append("-- Generated migration script from ERD")
        migrations.append("-- Generated at: " + str(datetime.now()))
        migrations.append("")
        
        # Drop tables if exists (for clean migration)
        for entity in reversed(erd_result.entities):
            table_name = entity.name.lower()
            migrations.append(f"DROP TABLE IF EXISTS {table_name};")
        
        # Drop junction tables
        for relationship in erd_result.relationships:
            if relationship.cardinality == "N:M":
                table_name = f"{relationship.entity1.lower()}_{relationship.entity2.lower()}"
                migrations.append(f"DROP TABLE IF EXISTS {table_name};")
        
        migrations.append("")
        
        # Create tables
        for entity in erd_result.entities:
            table_name = entity.name.lower()
            columns = []
            
            columns.append("id INTEGER PRIMARY KEY AUTOINCREMENT")
            
            for attr in entity.attributes:
                if attr != 'id':
                    sql_type = self._get_sql_type(attr)
                    nullable = "NULL" if attr not in entity.primary_keys else "NOT NULL"
                    columns.append(f"{attr} {sql_type} {nullable}")
            
            for fk in entity.foreign_keys:
                ref_table = fk.replace('_id', '').lower()
                columns.append(f"{fk} INTEGER NOT NULL")
                columns.append(f"FOREIGN KEY ({fk}) REFERENCES {ref_table}(id)")
            
            columns.append("created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP")
            columns.append("updated_at TEXT NULL")
            
            migrations.append(f"CREATE TABLE {table_name} (")
            migrations.append("    " + ",\n    ".join(columns))
            migrations.append(");")
            migrations.append("")
        
        return "\n".join(migrations)
