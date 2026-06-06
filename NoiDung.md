Tinh thần: Hướng dẫn người không biết gì nghĩ ra thuật toán chứ không phải dạy thuật toán để học thuộc
Ý tưởng:
Chưa cần nói gì về thuật toán djsktra hết (Nhắc đến tên thuật toán)
Tôi sẽ bắt đầu từ vấn đề thực tế (có thể là google map, ..._)
Xong đặt câu hỏi giờ muốn tìm đường ngắn nhất thì sao?
Cách tư duy đầu tiên ai cũng nghĩ đến thì sẽ là đi thử tất cả các đường xong chọn ra đường ngắn nhất
Nhưng cách này quá chậm và không hiệu quả
Thì giờ tôi sẽ bảo là tại sao không hiệu quả, có thể là vì thử lại quá nhiều đường mà đáng ra không cần phải thử (kiểu như đường này chắc chắn dài hơn rồi)
Thì bắt đầu bảo là có thể tối ưu nhanh bằng cách đường nào lâu hơn đường tốt nhất thì không đi tiếp nữa
Nhưng nó vẫn chậm
Nên nghĩ đến một hướng tiếp cận khác, tôi bảo là tư duy ngược thử xem, thay vì nghĩ làm sao đi từ đầu đến đích thì nghĩ bắt đầu từ đích thì có những cách nào để đến, từ đó tìm ra được vấn đề là để tìm đường ngắn nhất đến đích thì phải tìm đường ngắn nhất đến node trước nó
Xong sau đó trace ngược về ban đầu, sau đó dần dần tự xây dựng thuật toán djsktra
Sau khi đã xây dựng xong thuật toán đấy rồi, tôi mới bảo là đây là thuật toán tìm đường mà mọi người gọi là djkstra, nó rất đơn giản, ai cũng có thể nghĩ ra được bằng suy luận chứ không phải là mỗi ông kia có thể nghĩ ra
Bản chất của bài thuyết trình không phải là giới thiệu thuật toán mà là dẫn dắt làm sao để người ta cũng có thể nghĩ ra thuật toán đó

Flow:
- Vấn đề: Cần tìm đường ngắn nhất để đi từ A đến B
- Làm sao giải quyết? Cách mọi người sẽ nghĩ ngay đến: Đi thử tất cả các đường và chọn ra đường ngắn nhất
    + Cách này ra kết quả, nhưng rất chậm, vì đi quá nhiều đường không cần thiết và phải đi đến cuối tất cả đường (những đường có thể không dẫn đến đích)
    => cần một giải pháp tối ưu hơn
- Vậy hãy thử tư duy ngược, thay vì hỏi làm sao để tìm đường từ A->B, thì ta hãy nhìn từ B, hỏi để đến được B ta cần làm gì?
    + Muốn đến được B ta cần đến các điểm trước nó trước, vậy đường ngắn nhất đến B là đường ngắn nhất trong các đường ngắn nhất đến điểm trước đó (cái này sẽ show ra và chỉ trên hình)
    + Mà để đến điểm trước đó ta lại cần đến các điểm trước đó nữa,... Vậy => Bài toán trở thành tìm đường ngắn nhất đến các điểm có khả năng dẫn đến B
    + Vậy thì hãy nhìn từ gốc, nhìn vào hình hỏi xem hiện tại ta có thể chắc chắn đường đến đỉnh nào là đường ngắn nhất (Nhìn hình và giải thích) (Hình không phải góc nhìn thượng đế, chỉ hiện những đỉnh nào mà ta đã biết thôi, không hiện cả cái đồ thị ra) (Sẽ có visualizer, bấm vào đỉnh nào nếu đúng thì nó sẽ mở ra)
    + Tiếp tục mở 1,2 đỉnh ra như thế, sau đó sẽ bấm nút show cost (để hiện các đỉnh có cost ra), sau đó sẽ nói về phải chọn cái có cost bé nhất, vì nếu chọn cái có cost lớn hơn thì có thể tồn tại một đường đi qua cái cost bé nhất đấy đến cái đỉnh kia
    + Vậy là có ý tưởng rồi, ta phát biểu thành thuật toán
    + Sau đó tự xây dựng mã giả
- Sau đó nói về việc mỗi lần phải tìm cái có cost bé nhất thì hơi chậm, nhưng có thể tối ưu bằng cách cấu trúc dữ liệu thông minh hơn
- Sau đó nêu độ phức tạp của thuật toán
- Sau khi đã xây dựng thuật toán xong, thì bảo là thuật toán này thực chất có tên gọi là thuật toán Djstrka do ông Djstrka phát biểu đầu tiên, nhưng thực ra ai cũng có thể nghĩ ra thuật toán này hết

Nội dung chi tiết:
Phần 1 (Đứng dưới làn sương đăng ảnh):
Vấn đề: Google Maps tìm đường như thế nào:
    - Cần đi từ A đến B
    - Có nhiều tuyến đường khác nhau
    - Mỗi tuyến có chi phí khác nhau: thời gian, khoảng cách, tiền xăng...
    - Ta muốn chọn tuyến có chi phí nhỏ nhất
Vậy cần làm thế nào?
Ý tưởng tự nhiên nhất:
    - Đi thử tất cả các tuyến đường từ A đến B, đo chi phí của từng tuyến đường và chọn ra cái bé nhất
    - (Có thể show lên slide hoặc visualize, cho hiện thuật toán này chạy với số đường lớn)
    - Mọi người có thể nhận thấy được là cách này quá chậm vì phải thử quá nhiều đường không cần thiết, có nhiều đường mà chắc chắn nó đã quá dài để ta nên tiếp tục đi tiếp
    ![msedge_8rkELbs00s](https://hackmd.io/_uploads/B1C14wilfg.png)

    - Vậy thì có tối ưu được không?
        + Nhận thấy nếu đã tìm ra được một đường tốt nhất, thì các đường sau nếu chỉ cần lớn hơn đường ngắn nhất này thì ta không cần đi tiếp nữa
        + (Visualize trên slide/visualizer)
    => Tối ưu này đã làm nó nhanh hơn rất nhiều so với ban đầu, nhưng vẫn quá chậm vì ta vẫn phải đi thử hết các con đường, vậy có cách nào thông minh hơn không?

Phần 2 (tvk tvk tvk tvk tvk):
Nếu ta suy nghĩ làm thế nào để tìm đường ngắn nhất từ A->B thì sẽ có rất nhiều cách và rất dễ bị rối. Vậy hãy thử tư duy ngược xem sao? Thay vì nhìn từ A và cố tìm đường đến B thì ta hãy thử nhìn từ B. Đặt câu hỏi là để đến B ta cần làm gì?
(Chỉ luôn trên visualizer)
![msedge_2T8nCJefac](https://hackmd.io/_uploads/BymXEvixGg.png)


Để đến được B thì ta bắt buộc phải đến các điểm trước đó trước, ví dụ điểm trước B là D,E,F (cái này hiện trên visualizer thì không cần nói cx đc)
Vậy thì đường ngắn nhất CHỈ có thể là đường đi qua 1 trong 3 điểm D/E/F thôi. 
=> Đường đi ngắn nhất từ A đến B chính là việc chọn ra trong các khả năng sau: đi tốt nhất từ A đến D rồi đi từ D sang B, hoặc đi tốt nhất từ A đến E rồi đi từ E sang B, hoặc đi tốt nhất từ A đến F rồi đi từ F sang B.
Vậy đến đây, bài toán trở thành: Tìm quãng đường ngắn nhất từ A đến D, từ A đến E và từ A đến F
Nhưng lại tương tự, để tìm quãng đường ngắn nhất từ A đến D, ta lại cần tìm quãng đường ngắn nhất từ A đến F,... rồi để tìm đường ngắn nhất từ A đến F ta lại cần tìm,.... (các điểm sẽ show trên visualizer)
Cứ tiếp tục nhìn ngược như vậy, ta thấy đường ngắn nhất đến một điểm luôn phụ thuộc vào đường ngắn nhất đến các điểm đứng ngay trước nó. 
Vậy bài toán trở thành: Để tìm đường ngắn nhất từ A->B thì cần tìm đường ngắn nhất đến các điểm trước nó

Vậy show visualizer: 
Đứng từ A, đặt câu hỏi ta có thể chắc chắn đường đi đến điểm nào là ngắn nhất?
![msedge_j4vpgH2Y7A](https://hackmd.io/_uploads/BkuNEwjeGl.png)

- Thử D: Không chắc chắn đường đi AD là ngắn nhất vì biết đâu có tồn tại một đường nối CD = 3 thì sao? Lúc này đường đến D nhanh nhất không phải là AD mà phải là ACD. Vậy nên chưa chắc chắn được D là ngắn nhất
- Thử B: Tương tự
- Thử C: Vì đoạn AC ngắn nhất trong 3 đoạn, nên không tồn tại đường đi qua B hoặc C ngắn hơn AC, vì chắc chắn nếu đi qua B thì đường sẽ lớn hơn 4 > 2 
=> Ta có thể chắc chắn C
![image](https://hackmd.io/_uploads/BJxPNvoxze.png)

Từ C: Bằng suy luận tương tự, ta có thể chắc chắn tiếp B:
Đến đây, để dễ hình dung và tính toán, em sẽ đánh dấu vào góc của mỗi điểm quãng đường ngắn nhất để đi từ A đến điểm đó (đến hiện tại)

![msedge_fbeyf6ydfG](https://hackmd.io/_uploads/rkTuVPslMe.png)


Sau đó lại hỏi tương tự, ta có thể chắc chắn đỉnh nào? Lập luận đơn giản: Đoạn đường AE hiện tại là ngắn nhất trong 4 đoạn, vậy nên ta không thể vẽ ra một kịch bản nào mà đi đường ngắn hơn từ A đến E đi qua F,G,D được
Tương tự...
Vậy, ta rút ra được một kết luận, ở mỗi bước, ta luôn có thể chốt chắc chắn được quãng đường ngắn nhất đến thêm một điểm bằng cách chọn điểm có có quãng đường ngắn nhất hiện tại. Vậy muốn tìm đường ngắn nhất đến K ta chỉ cần chốt liên tục cho đến khi nào gặp K là xong, đến lúc đó tất nhiên ta sẽ thu được quãng đường ngắn nhất từ A->K

Phần 3: (Khó tránh): (Viết code live lúc thuyết trình)
Vậy ý tưởng đã có:
    - Chọn đỉnh đã mở có cost bé nhất hiện tại để chốt
    - Chốt xong, mở các đỉnh nối với đỉnh đó
    - Lặp lại đến khi nào chốt hết hoặc là tìm được điểm đích
(Viết mã giả th hay hơn, dễ nói hơn)
Vậy hãy xây dựng thành code:
"Chọn đỉnh đã mở có cost bé nhất hiện tại để chốt" => Tức là cần 1 mảng lưu các cost hiện tại và một mảng để lưu các đỉnh đã mở (mấy cái này nói lúc viết code nhé, nói đến đâu viết đến đấy)
Ý tưởng code:
```js
NganNhat(map,start,end) {
    Cost = []
    Visited = []

    // chắc chắn cost từ đầu đến start = 0
    Cost[start] = 0

    // Mục tiêu là chốt hết hoặc tìm được đích
    while (1) { // cứ while true trước
        if Chốt hết break;
        if Tìm được đích break;

        // bắt đấu sửa đoạn if Chốt hết break; 
        Vậy chốt hết khi nào? 
        Nói lại câu "Chọn đỉnh đã mở có cost bé nhất hiện tại để chốt"
        Tức là hết khi mà không chọn được đỉnh nào nữa

        Tức là đầu tiên chọn đỉnh thử trước đã
        
        ("Chọn đỉnh đã mở có cost bé nhất hiện tại để chốt")

        min = null
        for đỉnh in map {
            if Cost[đỉnh] != null và not Visted[đỉnh] { // Đỉnh đã mở và chưa chốt
                if min == null hoặc Cost[đỉnh] < Cost[min] {
                    min = dinh
                }
            }
        }
        // Rồi giờ kiểm tra xem khi nào break (Chốt hết)
        if min == null break;

        // Tới đây tức là đã chọn được đỉnh có cost nhỏ nhất hiện tại
        // Vậy đỉnh này chính là đỉnh sẽ chốt
        // lúc nãy có nói if Tìm được đích break;
        // =>
        if min == end break

        //Chốt:
        Visited[min] = true

        (Chốt xong, mở các đỉnh nối với đỉnh đó)
        for đỉnh kề in map[min] {
            // Mở ra thì phải gán cost vào cho nó, cost ngắn nhất có thể từ đầu đến đỉnh kề chính là cost ngắn nhất từ đỉnh hiện tại + cost từ đỉnh hiện tại tới đỉnh kề
            newCost = Cost[min] + cost từ min đến đỉnh kề
            // Giờ gán vào
            Cost[đỉnh kề] = newCost
            // Có một vấn đề, có thể đã tồn tại một cái cost ngắn hơn đến đỉnh này trước rồi, vậy chỉ set khi nào mà đỉnh chưa mở hoặc cost này ngắn hơn cost hiện tại (vì mục đích của mình là tìm cost ngắn nhất)
            // => Sửa lại thành
            if Cost[đỉnh kề] == null hoặc newCost < Cost[đỉnh kề] { // Tức là tìm được đường ngắn hơn
                Cost[đỉnh kề] = newCost
            }
        }

    }
    // Cần tìm quãng đường ngắn nhất đến end, thì return ra Cost[end] thôi
    return Cost[end]
}
```
=> sau khi sửa mọi thứ bước này thì code sẽ trông như này
```js
NganNhat(map,start,end) {
    Cost = []
    Visited = []
    
    Cost[start] = 0

    while (1) {
        min = null
        for đỉnh in map {
            if Cost[đỉnh] != null và not Visted[đỉnh] { 
                if min == null hoặc Cost[đỉnh] < Cost[min] {
                    min = dinh
                }
            }
        }
        if min == null break;
        if min == end break
        Visited[min] = true
        for đỉnh kề in map[min] {
            newCost = Cost[min] + cost từ min đến đỉnh kề
            if Cost[đỉnh kề] == null hoặc newCost < Cost[đỉnh kề] {
                Cost[đỉnh kề] = newCost
            }
        }
    }
    return Cost[end]
}
```
Nhưng có một vấn đề, hiện tại mới chỉ biết quãng đường ngắn nhất chứ không biết đường đi như nào
=> Ta cần lưu lại lịch sử đường đi ngắn nhất
Cách dễ nghĩ nhất là: với mỗi đỉnh, ta lưu luôn cả đường đi đến đỉnh đó.
Ví dụ:
Path[E] = [A, C, E]
Path[K] = [A, C, E, K]
Nhưng lưu kiểu này hơi thừa, vì ta đang xét theo kiểu chốt từng đỉnh
Tức là mỗi khi một đỉnh đã được chốt, ta đã chắc chắn rằng đường đi ngắn nhất đến đỉnh đó sẽ không thay đổi nữa.
Vậy thì ta không cần lưu nguyên cả đường đi đến từng đỉnh.
Chỉ cần biết: Để đi đến đỉnh này theo đường ngắn nhất hiện tại, thì trước đó ta đi qua đỉnh nào?
Ví dụ Path[E] = [A, C, E] ta có thể viết thành
Prev[E] = C
Prev[C] = A



Như ở trên đã nói 
"if Cost[đỉnh kề] == null hoặc newCost < Cost[đỉnh kề] { // Tức là tìm được đường ngắn hơn"
Tức là mỗi lần ta set Cost[đỉnh kề] = newCost là một lần ta tìm được đường ngắn hơn đến đỉnh kề đó từ min, vậy mỗi lần tìm được đường ngắn hơn, chỉ cần update lại path là xong
Thêm một mảng Prev = []
```js
NganNhat(map,start,end) {
    Cost = []
    Visited = []
    Prev = []
    
    Cost[start] = 0

    while (1) {
        min = null
        for đỉnh in map {
            if Cost[đỉnh] != null và not Visted[đỉnh] { 
                if min == null hoặc Cost[đỉnh] < Cost[min] {
                    min = dinh
                }
            }
        }
        if min == null break;
        if min == end break
        Visited[min] = true
        for đỉnh kề in map[min] {
            newCost = Cost[min] + cost từ min đến đỉnh kề
            if Cost[đỉnh kề] == null hoặc newCost < Cost[đỉnh kề] {
                Cost[đỉnh kề] = newCost
                //mỗi lần update Cost thì update lại path
                Path[đỉnh kề] = min
            }
        }
    }
    return Cost[end]
    // Giờ thay vì return ra Cost thì ta có thể return ra Prev
    return Prev;
}
```

Phần 4:
Đến đây ta đã xây dựng được một thuật toán tìm đường ngắn nhất từ A->B, vậy thì độ phức tạp của nó là bao nhiêu?
Với mỗi bước chạy, phải duyệt lại tất cả các đỉnh chưa duyệt để tìm ra đỉnh có cost bé nhất, cần n bước, 
và lặp lại việc duyệt này đến khi hết các đỉnh hoặc tìm được đích cần khoảng n bước nữa, vậy cần khoảng n^2 bước
Ở mỗi lần lấy 1 đỉnh, ta phải duyệt toàn bộ các đỉnh kề, vậy nên đến cuối cùng ta cần duyệt thêm khoảng E bước nữa (với E là số cạnh)
Vậy sẽ cần khoảng n^2 + E bước// n là số đỉnh, E là số cạnh
Vì số cạnh không bao giờ lớn hơn n^2
Nên độ phức tạp trở thành: O(n^2)


Ta thấy mỗi bước phải duyệt lại toàn bộ đồ thị hoặc các đỉnh đã mở để tìm đỉnh có cost bé nhất (mất khoảng n bước), làm vậy hơi chậm
Thực tế, nếu ta có thể tổ chức lại dữ liệu một cách thông minh hơn, chẳng hạn dùng một cấu trúc dữ liệu thích hợp để luôn lấy ra ngay được đỉnh có cost nhỏ nhất, thì bước này sẽ không còn tốn n bước nữa, mà sẽ nhanh hơn rất nhiều.
Với một cấu trúc dữ liệu thông minh thì ta có thể lấy ra đỉnh có cost nhỏ nhất chỉ trong O(logn), giúp kéo độ phức tạp xuống ~ O((n+E) logn) thay vì O(n^2)

Còn một vấn đề nữa, thuật toán vừa xây dựng rất tốt cho tìm đường thực tế, nhưng nếu đặt vào một đồ thị (Đồ thị không giống như bản đồ bình thường, nó có thể có cost âm), vì thuật toán ta xây dựng hiện tại đang chốt sớm quãng đường ngắn nhất đến một đỉnh trước khi đi qua nó, nếu đồ thị có cost âm thì ta không thể biết được đi tiếp có làm giảm cost không,
Còn một vấn đề nữa, thuật toán vừa xây dựng hoạt động rất hiệu quả với các đồ thị trong thực tế, vì quãng đường/cost luôn là dương hoặc bằng 0. Tuy nhiên, nếu áp dụng thuật toán này cho các đồ thị có cost âm (tức là đi qua cạnh đó sẽ giảm tổng cost), thì thuật toán sẽ gặp vấn đề. Lý do là ở mỗi bước, ta đã "chốt" chắc chắn đường ngắn nhất đến một đỉnh trước khi tiếp tục đi qua các đỉnh phía sau. Khi xuất hiện các cạnh âm, việc đi qua các đỉnh tiếp theo có thể làm giảm chi phí tổng thể, khiến việc "chốt" sớm đường ngắn nhất trở nên không chính xác nữa.
Vậy, điều kiện tiên quyết đề thuật toán của chúng ta chạy được đó là không được tồn tại cạnh có cost âm

Vậy từ đầu đến giờ, ta đã xây dựng được một thuật toán giúp tìm được đường ngắn nhất trong một bản đồ/đồ thị chỉ bằng những suy luận/lập luận rất cơ bản. Thực ra đây là một thuật toán rất phổ biến trên thế giới, được ông Dijkstra phát biểu lần đầu tiên cách đây gần 100 năm. Sau đó thuật toán này được mọi người gọi với tên ông là thuật toán Dijkstra. Nhưng bản chất thì bất kì ai đều có thể lập luận ra được. Dijkstra chỉ là cái tên được mọi người gọi