Kế hoạch contribution GitHub cho nhóm PerfumeStore

1. Thành viên

Du Kiệt

Trần Quốc Thắng

Thạch Ngọc Phú

Điền GitHub username và email đã xác minh:

Thành viên

GitHub username

Email dùng khi commit

Du Kiệt

<username>

<email>

Trần Quốc Thắng

<username>

<email>

Thạch Ngọc Phú

<username> ngocphuthach

<email> thachngocphu6@gmail.com

2. Nguyên tắc bắt buộc

Contribution phải phản ánh công việc thật.

Không được:

Dùng chung một tài khoản GitHub.

Dùng git commit --author để giả thành viên.

Tạo commit rỗng.

Chia một thay đổi nhỏ thành nhiều commit vô nghĩa.

Sửa lịch sử chỉ để làm đẹp biểu đồ contribution.

3. Tình trạng hiện tại

Lịch sử trong gói mã nguồn hiện tại chủ yếu thể hiện một tác giả chính, trong khi nhiều file nâng cấp đang ở trạng thái chưa commit. Vì vậy, nhóm cần phân công lại phần việc thật, để từng thành viên đọc, sửa, test và chịu trách nhiệm trước khi commit.

4. Phân công đề xuất

Bảng dưới đây chỉ là gợi ý. Chỉ giữ phân công nếu đúng với công việc thực tế.

Thành viên đề xuất

Phạm vi có thể nhận

Tệp tiêu biểu

Trần Quốc Thắng

Backend architecture, database, product/order API

backend/src/, backend/database/

Du Kiệt

Docker, CI/CD, VPS, validation

Dockerfile, docker-compose.yml, .github/, docs/DEPLOY_VPS.md

Thạch Ngọc Phú

Frontend, Figma, Jira, báo cáo và tài liệu

frontend/, docs/FIGMA_HANDOFF.md, docs/JIRA_WORKFLOW.md

Review phải chéo: người viết không tự approve PR của mình.

5. Công việc tài liệu có thể commit thật

Các tệp trong docs/ chỉ nên commit sau khi thành viên đã:

Đọc mã nguồn liên quan.

Kiểm tra thông tin trong tài liệu.

Sửa nội dung hoặc bổ sung minh chứng thật.

Chạy lệnh/test nếu tài liệu có ghi kết quả.

Mở PR để thành viên khác review.

Gợi ý ticket tài liệu:

Cập nhật ARCHITECTURE.md và sơ đồ Mermaid.

Rà soát REQUIREMENTS_AUDIT.md theo mã nguồn mới.

Chạy test và điền VALIDATION_REPORT.md bằng kết quả thật.

Hoàn thiện DEPLOY_VPS.md sau khi triển khai thử.

Gắn link Jira/Figma/GitHub thật vào tài liệu.

6. Quy trình một ticket

git checkout develop
git pull origin develop
git checkout -b docs/PERF-20-update-architecture

# sửa trong VS Code, kiểm tra diff
git status
git diff -- docs/ARCHITECTURE.md

git add docs/ARCHITECTURE.md
git commit -m "PERF-20 docs(architecture): update layered backend and order flow"
git push -u origin docs/PERF-20-update-architecture

Sau đó mở Pull Request vào develop, liên kết Jira và yêu cầu người khác review.

7. Nhịp contribution đề xuất

Mỗi thành viên có 2–4 phiên làm việc thật mỗi tuần nếu tiến độ cho phép.

Mỗi phiên tạo commit theo đơn vị thay đổi hoàn chỉnh.

Không dồn toàn bộ công việc vào ngày cuối.

Commit code và tài liệu phải build/test được hoặc có mục đích rõ.

8. Commit convention

PERF-<id> <type>(<scope>): <mô tả>

Type:

feat: chức năng mới.

fix: sửa lỗi.

refactor: cải tổ không đổi hành vi.

test: kiểm thử.

docs: tài liệu.

chore: cấu hình/bảo trì.

ci: workflow CI/CD.

Ví dụ:

PERF-11 feat(auth): add JWT bearer and admin role middleware
PERF-13 fix(order): calculate total from database prices
PERF-16 test(openapi): verify required paths and bearer scheme
PERF-20 docs(architecture): document transaction and Docker network

9. Checklist trước khi commit

Đúng branch/ticket.

git diff chỉ chứa thay đổi liên quan.

Không có .env, key hoặc secret.

Code đã check/test.

Tài liệu không ghi kết quả chưa chạy.

Commit message có Jira ID và mô tả rõ.

10. Minh chứng cần chụp

Contributors graph của cả ba thành viên.

Commit history phân bố theo ngày.

Pull Requests có review chéo.

Jira ticket có link branch/commit/PR.

GitHub Actions xanh trên PR và main.

Các comment review và thay đổi sau review.