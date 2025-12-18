1. Lần đầu: Clone repo về máy
git clone https://github.com/jivin01/CNPM.git
cd your-repo

2. Trước khi bắt đầu làm việc (luôn luôn làm mỗi lần mở máy)
git checkout main           # Chuyển về nhánh chính (main)
git pull origin main        # Kéo về những thay đổi mới nhất từ remote

3. Tạo branch mới để làm việc (KHÔNG làm trực tiếp trên main)
git checkout -b feature/ten-tinh-nang

4. Chỉnh sửa code, thêm file, sửa file
5. Thêm file đã sửa/thêm vào stage

Nếu muốn add từng nhóm file, ví dụ backend:

git add src/backend/models.py
git add src/backend/schemas.py
git add src/backend/main.py


Hoặc add toàn bộ thay đổi (dùng khi chắc chắn):

git add .

6. Commit thay đổi với message rõ ràng
git commit -m "Mô tả ngắn gọn thay đổi: thêm tính năng X, sửa bug Y"

7. Kéo về thay đổi mới nhất từ remote (nếu có người khác push trước bạn)
git pull origin main


Nếu có conflict, xử lý conflict rồi tiếp tục:

git add <file đã fix conflict>
git commit -m "Resolve merge conflict"

8. Đẩy branch cá nhân lên remote
git push origin feature/ten-tinh-nang

9. Tạo Pull Request (PR) trên GitHub để nhóm review, merge vào main
10. Khi PR được merge, về lại branch main, kéo về thay đổi mới nhất
git checkout main
git pull origin main