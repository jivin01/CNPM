from supabase import create_client, Client
from config.settings import SUPABASE_URL, SUPABASE_KEY

class SupabaseManager:
    def __init__(self):
        self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    def get_user_session(self, token: str):
        # Kiểm tra session người dùng từ Supabase Auth
        return self.supabase.auth.get_user(token)

    def fetch_fast_medical_data(self, table_name: str, query_id: str):
        # Lấy dữ liệu y tế cực nhanh từ Supabase
        return self.supabase.table(table_name).select("*").eq("id", query_id).execute()