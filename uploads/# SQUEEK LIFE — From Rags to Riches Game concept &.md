# SQUEEK LIFE — From Rags to Riches

Game concept & development plan · Squeekchain Sepolia Testnet

Mình đề xuất phát triển ý tưởng của bạn thành một pixel adventure game kết hợp life simulation, kiếm tiền, nâng cấp nhân vật và Web3. Người chơi bắt đầu với một chú chuột nghèo, không có tài sản, phải làm nhiều công việc để từng bước thay đổi cuộc sống.

Điểm thú vị nhất không chỉ là mua được điện thoại, xe hơi hay quần áo mới, mà là người chơi có thể nhìn thấy chú chuột thực sự thay đổi ngoại hình, môi trường sống và địa vị xã hội qua từng giai đoạn.

## 1. Cốt truyện hoàn chỉnh

[The Adventures of Mouse and Rat | Story.com](https://images.openai.com/static-rsc-4/OQMQAcH4Ky93gpkm7TuR16fHlg08JotLL1Tpjpbw2_HTP9Iour1WszlvBikwB24PZuKrweNZBeQ0ydeTLi65-teVDyDDi3-6pT8YeClfpZSlcbxPwBta2Epx7x1AIXROmsN8rIErIznuGJpHquQZOUWdk--G8joBPP5eS8pEupM?purpose=inline)

Chapter 1 — Rock Bottom

Chú chuột Squeek tỉnh dậy trong khu ổ chuột, mặc áo rách và chỉ có 0 Coins. Bị những chú chuột giàu có coi thường, Squeek quyết tâm đổi đời. Nhiệm vụ đầu tiên là thu gom rác, giao hàng và kiếm những đồng tiền đầu tiên.

[Steam Community :: Go! Go! Hamster Chef!](https://images.openai.com/static-rsc-4/DMKydXYSeYY93p4j4HBfK2mltAf5fD4ACBDY8_OT3JcZnfZ73-DXAXWLKg6VUvS-xEMajy34EfPtYbdlJgAWXpI0GfHWpFlZwg5voAjY5tdaTHAkgkatpkwhefCORdUVcStBmPBUMd5OpC5ZzcdI_aRMm-8zcuCDZrgKzaZ3d7M?purpose=inline)

Chapter 2 — The Grind

Squeek bắt đầu làm việc tại cửa hàng thức ăn, nhà máy và dịch vụ giao hàng. Mua được bộ quần áo mới, điện thoại cũ và chiếc xe đạp đầu tiên. Mở khóa thêm những công việc có thu nhập cao hơn.

[悪口診断｜無料性格診断で暴く、あなたの害獣タイプ](https://images.openai.com/static-rsc-4/ie2cYvhUcM2g_SQ1YlVUETUIf5iFu-SbVn30zcvev_D8S9iOTOEvL1nozwsh7w6azhFtklMvcLTfjoESpTDKuX9hA5IoPo_ii-zTEhg5TviOFLbb08SgDMwEmNz6NsaMaDrO165KRpEmHLFTxXPSfW9HiHLirceLb6ewghvuETE?purpose=inline)

Chapter 3 — Level Up

Squeek chuyển đến trung tâm thành phố, có điện thoại xịn, xe máy và trang phục mới. Các công việc cao cấp được mở khóa. Người chơi bắt đầu phải quyết định đầu tư vào tài sản hay tiếp tục nâng cấp kỹ năng.

[Custom animals pixel art🦈🐒🐖🦀🦄 :: Behance](https://images.openai.com/static-rsc-4/FiuJbmBV1DIfFT2XZ6G6SJFx8uS5kvJ_lUYxrtWF3Pm1M1AD_IJfVPYvEYw-i10GxANsd7kwo80CqQoDqp50iOi_N22D2iC_MkrVhNaf-DESp0T6009SpMmwSmuNr8IfuOZgVb6ZZlNjsQgyrLXNrEKFkYiGS_XZIVkzo66ZHNQ?purpose=inline)

Chapter 4 — The Big Break

Squeek xây dựng một công việc kinh doanh nhỏ, tích lũy tiền mua ô tô và bộ vest sang trọng. Khu nhà giàu ở phía cuối bản đồ dần hiện ra. Đây là giai đoạn người chơi phải kiếm đủ tiền để sở hữu tấm vé vào khu vực thượng lưu.

[Tim Cheese: Common Brainrot Character in Steal a Brainrot](https://images.openai.com/static-rsc-4/Htu27ftcjTtumiYLpzwLa4STMfoCfS6hGXvU5DyhH8UdQGStjqGb9RlVOtU8_srL2AArC-KzW28Ir_APWsd4JXThhenDkHNHTs5-UlS4APpRov-Gj-DjR9sqqOMegFcUR_3B2OtoxeYKjJEUOul95h0X6fw8TciRdq0tgIQFrL0?purpose=inline)

Chapter 5 — The Rich District

Squeek lái chiếc xe của mình đến cổng khu nhà giàu. Khi đáp ứng đủ yêu cầu tài sản, cánh cổng mở ra, pháo hoa xuất hiện và người chơi nhận được danh hiệu SELF-MADE SQUEEK. Game kết thúc bằng cảnh chú chuột bước vào cuộc sống mới.

## 2. Gameplay chính

Mình đề xuất một game 2D pixel góc nhìn từ trên xuống, tương tự game RPG đời đầu. Người chơi có thể di chuyển tự do bằng WASD, tương tác với NPC, nhận công việc và mua đồ tại cửa hàng.

Core gameplay loop

MVP

Work — Kiếm Coins

Shop — Mua vật phẩm

Upgrade — Mở khóa kỹ năng

Explore — Khám phá khu mới

Rich District — Win

### Hệ thống kinh tế (đề xuất cân bằng ban đầu)

| Công việc       | Phần thưởng | Điều kiện     |
| --------------- | ----------- | ------------- |
| Nhặt rác        | 10 Coins    | Mặc định      |
| Giao thức ăn    | 30 Coins    | Có xe đạp     |
| Làm nhân viên   | 70 Coins    | Có điện thoại |
| Kinh doanh      | 150 Coins   | Có xe máy     |
| Startup founder | 400 Coins   | Có laptop     |

Người chơi cần quản lý hai chỉ số: Coins dùng mua sắm và Energy dùng làm việc. Energy hồi theo thời gian chơi, tránh việc chỉ spam nút kiếm tiền.

Mình khuyên để thời lượng hoàn thành game khoảng 20–30 phút, với 5 giai đoạn biến đổi ngoại hình rõ rệt và nhiều animation hài hước. Đây là mục tiêu thiết kế, có thể cân bằng lại sau khi playtest.

## 3. Tích hợp Squeekchain thật sự

Có một chi tiết kỹ thuật quan trọng: theo tài liệu hiện tại, Squeekchain là hệ thống toychain dùng dữ liệu công việc của hamster để tạo Squeek blocks, nhưng các smart contract hiện được triển khai trên Ethereum Sepolia, với Chain ID `11155111`, chứ chưa phải một EVM chain độc lập có RPC riêng được tài liệu xác nhận.&#x20;

Điều này hoàn toàn phù hợp cho game của bạn. Ta có thể kết nối ví trên Sepolia và xây dựng game contract riêng, đồng thời đọc dữ liệu thực từ hệ thống Squeekchain.

| Thành phần              | Cách triển khai                 |
| ----------------------- | ------------------------------- |
| Wallet                  | MetaMask / ví hỗ trợ EVM        |
| Network                 | Ethereum Sepolia                |
| Game Coins              | Tiền tệ nội bộ, không phải SQK  |
| Game progress           | Local trước, smart contract sau |
| Achievement             | Onchain achievement hoặc NFT    |
| Squeekchain integration | Đọc dữ liệu SqueekCore          |
| Game NFT                | ERC-721 riêng, tùy chọn         |

Mình đặc biệt khuyên không dùng SQK thật để trả lương công việc trong game ở MVP. Điều đó tạo ra nền kinh tế thưởng token phức tạp, có nguy cơ bị farm và đòi hỏi token treasury. Thay vào đó, Coins chỉ là điểm chơi; còn liên kết Web3 sẽ thể hiện qua thành tích và trạng thái ví.

Một tính năng rất hợp với Squeekchain là Hamster Power: khi chú hamster Squeektoshi ngoài đời thực chạy trên WHEELY9000, game hiển thị chuyển động và dữ liệu tiến độ tương ứng. Squeekchain cung cấp API public read-only tại `https://api.squeekchain.com/v1/…`, có thể dùng để hiển thị dữ liệu mà không cần API key.&#x20;

Bạn không cần cung cấp thêm tài liệu để bắt đầu xây dựng MVP. Mình đã tìm được tài liệu dành cho developer của Squeekchain, gồm hướng dẫn kết nối Sepolia, contract ABI, API và tài liệu dành riêng cho AI coding agents.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://docs.squeekchain.com\&sz=32)

Squeekchain Docs+1



Mình đề xuất dùng tên game Squeek Life: From Rags to Riches và xây dựng theo hướng:

- Pixel RPG 2D, góc nhìn từ trên xuống, có bản đồ và nhân vật di chuyển bằng WASD.
- Chuột bắt đầu nghèo khó, kiếm tiền qua các mini-game, mua quần áo, điện thoại, phương tiện và mở khóa khu vực.
- Có 5 chương, kết thúc khi nhân vật bước vào Rich District.
- Kết nối ví EVM trên Ethereum Sepolia, lưu tiến trình chơi và hỗ trợ thành tích onchain.
- Lấy dữ liệu thật từ Squeekchain để tạo một số sự kiện và tương tác trong game.

Một lưu ý kỹ thuật: Squeekchain đang trong quá trình phát triển và có khả năng thay đổi deployment. Vì thế, mình sẽ yêu cầu Codex kiểm tra địa chỉ contract thực tế từ nguồn chính thức thay vì mặc định sử dụng địa chỉ cũ.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://docs.squeekchain.com\&sz=32)

Squeekchain Docs+1



Mình sẽ đóng gói thành bộ tài liệu gồm Game Design Document, đặc tả kỹ thuật, hệ thống kinh tế, hướng dẫn Web3 và prompt triển khai dành cho Codex.

## Bộ tài liệu dành cho Codex đã hoàn thành

Squeek Life — Codex Starter Pack

ZIP · 4 tài liệu Markdown · Sẵn sàng đưa vào coding agent

&#x20;Tải toàn bộ bộ tài liệu

Các tệp trong gói:

GAME_DESIGN_DOCUMENT.md

WEB3_INTEGRATION.md

CODEX_MASTER_PROMPT.md

README.md

## Cách sử dụng

1. Giải nén và đưa toàn bộ thư mục vào workspace của Codex hoặc Surf Pro Studio.
2. Mở `CODEX_MASTER_PROMPT.md`, sao chép nội dung và gửi cho coding agent.
3. Yêu cầu agent thực hiện lần lượt từ M1 đến M5, chạy thử và kiểm tra game sau mỗi giai đoạn.
4. Sau khi game chơi được hoàn chỉnh, mới triển khai smart contract achievement nếu cần.

Một điểm mình muốn nhấn mạnh: đừng đưa toàn bộ kinh tế game lên blockchain ngay từ đầu. Hãy tập trung làm gameplay thú vị, nhân vật lột xác rõ rệt và trải nghiệm kết nối ví thật mượt. Sau đó mới mở rộng tính năng onchain.

Bộ này là đặc tả sản phẩm và hướng dẫn triển khai, chưa phải source code game hoàn chỉnh.

Về sau, hai tài liệu bổ sung có ích nhất là sprite/logo hamster chính thức từ team Squeekchain và xác nhận của team về deployment testnet đang hoạt động. Nhưng bạn có thể bắt đầu code ngay với bộ tài liệu trên.