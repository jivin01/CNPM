"""
Create clinic management tables
"""
import asyncio
from sqlalchemy import text
from app.database.connection import get_db

async def create_clinic_tables():
    """Create clinic management tables"""
    async for db in get_db():
        try:
            # Create clinics table
            await db.execute(text("""
                CREATE TABLE IF NOT EXISTS clinics (
                    id VARCHAR(36) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    phone VARCHAR(50) NOT NULL,
                    address TEXT NOT NULL,
                    city VARCHAR(100) NOT NULL,
                    country VARCHAR(100) NOT NULL,
                    postal_code VARCHAR(20) NOT NULL,
                    status VARCHAR(50) NOT NULL DEFAULT 'pending',
                    verified_at DATETIME,
                    verified_by VARCHAR(36),
                    license_number VARCHAR(100) NOT NULL,
                    tax_id VARCHAR(100) NOT NULL,
                    website VARCHAR(255),
                    contact_person_name VARCHAR(255) NOT NULL,
                    contact_person_email VARCHAR(255) NOT NULL,
                    contact_person_phone VARCHAR(50) NOT NULL,
                    current_package VARCHAR(100) NOT NULL DEFAULT 'basic',
                    package_expires_at DATETIME,
                    analysis_credits INTEGER NOT NULL DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME
                )
            """))
            
            # Create clinic_profiles table
            await db.execute(text("""
                CREATE TABLE IF NOT EXISTS clinic_profiles (
                    id VARCHAR(36) PRIMARY KEY,
                    clinic_id VARCHAR(36) NOT NULL,
                    description TEXT,
                    specialties TEXT,
                    facilities TEXT,
                    total_patients INTEGER NOT NULL DEFAULT 0,
                    total_analyses INTEGER NOT NULL DEFAULT 0,
                    high_risk_cases INTEGER NOT NULL DEFAULT 0,
                    auto_assign_doctors BOOLEAN NOT NULL DEFAULT 0,
                    require_doctor_validation BOOLEAN NOT NULL DEFAULT 1,
                    notification_settings TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME,
                    FOREIGN KEY (clinic_id) REFERENCES clinics(id)
                )
            """))
            
            # Create clinic_users table
            await db.execute(text("""
                CREATE TABLE IF NOT EXISTS clinic_users (
                    id VARCHAR(36) PRIMARY KEY,
                    clinic_id VARCHAR(36) NOT NULL,
                    user_id VARCHAR(36) NOT NULL,
                    role VARCHAR(50) NOT NULL DEFAULT 'staff',
                    permissions TEXT,
                    status VARCHAR(50) NOT NULL DEFAULT 'active',
                    invited_by VARCHAR(36),
                    joined_at DATETIME,
                    department VARCHAR(100),
                    license_number VARCHAR(100),
                    specialization VARCHAR(255),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME,
                    FOREIGN KEY (clinic_id) REFERENCES clinics(id),
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            """))
            
            # Add clinic_id to medical_images table if not exists
            try:
                await db.execute(text("""
                    ALTER TABLE medical_images 
                    ADD COLUMN clinic_id VARCHAR(36)
                """))
                # Add foreign key constraint (SQLite doesn't support ALTER TABLE ADD CONSTRAINT)
                # This will be handled at application level
            except Exception:
                pass  # Column might already exist
            
            # Add clinic_id and email to patient_profiles table if not exists
            try:
                await db.execute(text("""
                    ALTER TABLE patient_profiles 
                    ADD COLUMN clinic_id VARCHAR(36)
                """))
            except Exception:
                pass  # Column might already exist
                
            try:
                await db.execute(text("""
                    ALTER TABLE patient_profiles 
                    ADD COLUMN email VARCHAR(255)
                """))
            except Exception:
                pass  # Column might already exist
                
            try:
                await db.execute(text("""
                    ALTER TABLE patient_profiles 
                    ADD COLUMN phone VARCHAR(50)
                """))
            except Exception:
                pass  # Column might already exist
            
            # SQLite doesn't support ALTER TABLE DROP NOT NULL, so we need to recreate the table
            # For now, we'll work with existing constraints
            
            await db.commit()
            print("✅ Clinic management tables created successfully!")
            
        except Exception as e:
            print(f"❌ Error creating clinic tables: {e}")
            await db.rollback()
        finally:
            break

if __name__ == "__main__":
    asyncio.run(create_clinic_tables())
