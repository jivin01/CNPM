"""Add clinic management tables

Revision ID: add_clinic_tables
Revises: initial_migration
Create Date: 2024-02-02 01:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_clinic_tables'
down_revision = 'initial_migration'
branch_labels = None
depends_on = None

def upgrade():
    # Create clinics table
    op.create_table('clinics',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=50), nullable=False),
        sa.Column('address', sa.Text(), nullable=False),
        sa.Column('city', sa.String(length=100), nullable=False),
        sa.Column('country', sa.String(length=100), nullable=False),
        sa.Column('postal_code', sa.String(length=20), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('verified_by', sa.String(length=36), nullable=True),
        sa.Column('license_number', sa.String(length=100), nullable=False),
        sa.Column('tax_id', sa.String(length=100), nullable=False),
        sa.Column('website', sa.String(length=255), nullable=True),
        sa.Column('contact_person_name', sa.String(length=255), nullable=False),
        sa.Column('contact_person_email', sa.String(length=255), nullable=False),
        sa.Column('contact_person_phone', sa.String(length=50), nullable=False),
        sa.Column('current_package', sa.String(length=100), nullable=False),
        sa.Column('package_expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('analysis_credits', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    
    # Create clinic_profiles table
    op.create_table('clinic_profiles',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('clinic_id', sa.String(length=36), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('specialties', sa.Text(), nullable=True),
        sa.Column('facilities', sa.Text(), nullable=True),
        sa.Column('total_patients', sa.Integer(), nullable=False),
        sa.Column('total_analyses', sa.Integer(), nullable=False),
        sa.Column('high_risk_cases', sa.Integer(), nullable=False),
        sa.Column('auto_assign_doctors', sa.Boolean(), nullable=False),
        sa.Column('require_doctor_validation', sa.Boolean(), nullable=False),
        sa.Column('notification_settings', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['clinic_id'], ['clinics.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create clinic_users table
    op.create_table('clinic_users',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('clinic_id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False),
        sa.Column('permissions', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('invited_by', sa.String(length=36), nullable=True),
        sa.Column('joined_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('department', sa.String(length=100), nullable=True),
        sa.Column('license_number', sa.String(length=100), nullable=True),
        sa.Column('specialization', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['clinic_id'], ['clinics.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Add clinic_id to medical_images table
    op.add_column('medical_images', sa.Column('clinic_id', sa.String(length=36), nullable=True))
    op.create_foreign_key('fk_medical_images_clinic_id', 'medical_images', 'clinics', ['clinic_id'], ['id'])
    
    # Add clinic_id and email to patient_profiles table
    op.add_column('patient_profiles', sa.Column('clinic_id', sa.String(length=36), nullable=True))
    op.add_column('patient_profiles', sa.Column('email', sa.String(length=255), nullable=True))
    op.create_foreign_key('fk_patient_profiles_clinic_id', 'patient_profiles', 'clinics', ['clinic_id'], ['id'])
    
    # Make user_id nullable in patient_profiles
    op.alter_column('patient_profiles', 'user_id',
                    existing_type=sa.String(length=36),
                    nullable=True)
    
    # Make date_of_birth nullable in patient_profiles
    op.alter_column('patient_profiles', 'date_of_birth',
                    existing_type=sa.DateTime(timezone=True),
                    nullable=True)
    
    # Add phone column to patient_profiles
    op.add_column('patient_profiles', sa.Column('phone', sa.String(length=50), nullable=True))

def downgrade():
    # Remove phone from patient_profiles
    op.drop_column('patient_profiles', 'phone')
    
    # Make date_of_birth not nullable
    op.alter_column('patient_profiles', 'date_of_birth',
                    existing_type=sa.DateTime(timezone=True),
                    nullable=False)
    
    # Make user_id not nullable
    op.alter_column('patient_profiles', 'user_id',
                    existing_type=sa.String(length=36),
                    nullable=False)
    
    # Remove clinic_id and email from patient_profiles
    op.drop_constraint('fk_patient_profiles_clinic_id', 'patient_profiles', type_='foreignkey')
    op.drop_column('patient_profiles', 'email')
    op.drop_column('patient_profiles', 'clinic_id')
    
    # Remove clinic_id from medical_images
    op.drop_constraint('fk_medical_images_clinic_id', 'medical_images', type_='foreignkey')
    op.drop_column('medical_images', 'clinic_id')
    
    # Drop clinic_users table
    op.drop_table('clinic_users')
    
    # Drop clinic_profiles table
    op.drop_table('clinic_profiles')
    
    # Drop clinics table
    op.drop_table('clinics')
