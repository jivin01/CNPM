# FILE: app.py
import streamlit as st
import pandas as pd
import plotly.express as px
from database import init_db, login_user, add_user, save_record, get_all_records
from ai_core import analyze_image

# --- 1. CONFIG TRANG WEB ---
st.set_page_config(page_title="AURA Health", page_icon="👁️", layout="wide")
init_db() # Chạy khởi tạo DB ngay khi mở app

# --- 2. GIAO DIỆN AUTH (LOGIN/REGISTER) ---
if 'logged_in' not in st.session_state:
    st.session_state['logged_in'] = False

def login_page():
    st.markdown("<h1 style='text-align: center; color: #2E86C1;'>👁️ AURA RETINAL SYSTEM</h1>", unsafe_allow_html=True)
    st.markdown("<h4 style='text-align: center;'>Hệ thống Sàng lọc Sức khỏe Mạch máu Võng mạc</h4>", unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns([1,2,1])
    with col2:
        tab1, tab2 = st.tabs(["Đăng nhập", "Đăng ký"])
        
        with tab1:
            username = st.text_input("Tài khoản", placeholder="admin")
            password = st.text_input("Mật khẩu", type="password", placeholder="123456")
            if st.button("Đăng nhập ngay", use_container_width=True):
                user = login_user(username, password)
                if user:
                    st.session_state['logged_in'] = True
                    st.session_state['username'] = username
                    st.session_state['role'] = user[0][2]
                    st.success("Đăng nhập thành công!")
                    st.rerun()
                else:
                    st.error("Sai tài khoản hoặc mật khẩu")
        
        with tab2:
            new_user = st.text_input("Tạo tài khoản mới")
            new_pass = st.text_input("Tạo mật khẩu", type="password")
            new_fullname = st.text_input("Họ và tên đầy đủ")
            new_role = st.selectbox("Vai trò", ["Doctor", "Patient"])
            if st.button("Đăng ký tài khoản", use_container_width=True):
                if add_user(new_user, new_pass, new_role, new_fullname):
                    st.success("Đã tạo tài khoản. Mời đăng nhập.")
                else:
                    st.warning("Tài khoản đã tồn tại.")

# --- 3. GIAO DIỆN CHÍNH (SAU KHI LOGIN) ---
def main_app():
    # Sidebar thông tin
    st.sidebar.title("AURA Menu")
    st.sidebar.info(f"👤 User: {st.session_state['username']}\n\nrole: {st.session_state['role']}")
    
    menu_options = ["Chẩn đoán (AI)", "Dashboard Thống kê", "Hồ sơ cá nhân"]
    choice = st.sidebar.radio("Chức năng", menu_options)
    
    if st.sidebar.button("Đăng xuất"):
        st.session_state['logged_in'] = False
        st.rerun()

    # --- TRANG 1: CHẨN ĐOÁN (QUAN TRỌNG NHẤT) ---
    if choice == "Chẩn đoán (AI)":
        st.header("🔬 Phân tích Ảnh Đáy mắt")
        col1, col2 = st.columns([1, 2])
        
        with col1:
            patient_name = st.text_input("Tên bệnh nhân", placeholder="Ví dụ: Nguyen Van A")
            uploaded_file = st.file_uploader("Tải ảnh lên", type=['jpg', 'png', 'jpeg'])
            analyze_btn = st.button("🚀 Chạy Phân tích AI", type="primary")

        if uploaded_file and analyze_btn:
            if not patient_name:
                st.warning("Vui lòng nhập tên bệnh nhân!")
            else:
                with col2:
                    with st.spinner("AI đang quét mạch máu... (Giả lập ResNet50)"):
                        # Gọi hàm từ file ai_core.py
                        processed_img, risk, conf = analyze_image(uploaded_file)
                        
                        # Hiển thị kết quả
                        st.image(processed_img, caption=f"Kết quả: {risk}", use_column_width=True)
                        
                        # Thông báo màu sắc
                        if "Normal" in risk:
                            st.success(f"✅ Kết quả: {risk} - Độ tin cậy: {conf*100}%")
                        else:
                            st.error(f"⚠️ CẢNH BÁO: {risk} - Độ tin cậy: {conf*100}%")
                            st.info("💡 Khuyến nghị: Cần chuyển tuyến trên kiểm tra chuyên sâu.")

                        # Lưu vào Database
                        save_record(st.session_state['username'], patient_name, 
                                    uploaded_file.name, risk, conf)
                        st.toast("Đã lưu kết quả vào hồ sơ!", icon="💾")

    # --- TRANG 2: DASHBOARD (ADMIN VIEW) ---
    elif choice == "Dashboard Thống kê":
        st.header("📊 Thống kê Dữ liệu Khám")
        df = get_all_records()
        
        if not df.empty:
            # 1. Hiển thị Metrics
            m1, m2, m3 = st.columns(3)
            m1.metric("Tổng ca khám", len(df))
            m2.metric("Ca bất thường", len(df[df['risk_level'] != 'Normal (Bình thường)']))
            m3.metric("Bác sĩ phụ trách", df['doctor_user'].nunique())
            
            # 2. Biểu đồ tròn tỉ lệ bệnh
            fig = px.pie(df, names='risk_level', title='Tỉ lệ các loại bệnh đã phát hiện')
            st.plotly_chart(fig, use_container_width=True)
            
            # 3. Bảng dữ liệu chi tiết
            st.subheader("Dữ liệu chi tiết")
            st.dataframe(df)
        else:
            st.info("Chưa có dữ liệu nào. Hãy thực hiện khám bệnh trước.")

    elif choice == "Hồ sơ cá nhân":
        st.subheader("Thông tin tài khoản")
        st.write("Phiên bản hệ thống: v1.0.0 (MVP)")
        st.write("Liên hệ kỹ thuật: admin@aura.com")

# --- 4. ĐIỀU HƯỚNG CHÍNH ---
if st.session_state['logged_in']:
    main_app()
else:
    login_page()