(function () {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dur = (value) => (prefersReducedMotion ? 0.01 : value);

  const graphProfiles = {
    part1: {
      terminalNodes: ["A", "B"],
      nodes: {
        A: { x: 92, y: 330 },
        C: { x: 230, y: 206 },
        D: { x: 252, y: 454 },
        E: { x: 382, y: 326 },
        F: { x: 530, y: 238 },
        G: { x: 516, y: 462 },
        H: { x: 664, y: 142 },
        I: { x: 682, y: 356 },
        J: { x: 804, y: 268 },
        K: { x: 774, y: 512 },
        B: { x: 914, y: 342 },
      },
      edges: [
        ["A", "C", 6],
        ["A", "D", 9],
        ["A", "E", 4],
        ["C", "F", 8],
        ["C", "E", 5],
        ["C", "D", 7],
        ["D", "E", 3],
        ["D", "G", 7],
        ["D", "K", 20],
        ["E", "F", 4],
        ["E", "G", 11],
        ["F", "H", 6],
        ["F", "I", 7],
        ["F", "J", 5],
        ["G", "I", 4],
        ["G", "K", 8],
        ["H", "J", 9],
        ["I", "J", 3],
        ["I", "B", 8],
        ["J", "B", 3],
        ["K", "B", 7],
        ["G", "B", 18],
      ],
    },
    part2: {
      terminalNodes: ["A", "K"],
      nodes: {
        A: { x: 96, y: 332 },
        C: { x: 272, y: 186 },
        B: { x: 300, y: 382 },
        D: { x: 408, y: 522 },
        E: { x: 456, y: 360 },
        F: { x: 648, y: 248 },
        G: { x: 662, y: 500 },
        K: { x: 884, y: 382 },
      },
      edges: [
        ["A", "C", 2],
        ["A", "B", 4],
        ["A", "D", 7],
        ["A", "E", 6],
        ["C", "B", 1],
        ["C", "D", 3],
        ["B", "E", 1],
        ["E", "F", 2],
        ["E", "G", 5],
        ["D", "F", 2],
        ["D", "G", 7],
        ["F", "K", 4],
        ["G", "K", 2],
      ],
    },
  };

  let nodes = graphProfiles.part1.nodes;
  let edges = graphProfiles.part1.edges;

  const demoScanRoutePaths = [
    ["A", "D", "K", "B"],
    ["A", "C", "F", "I", "B"],
    ["A", "D", "G", "I", "J", "B"],
    ["A", "C", "E", "F", "J", "B"],
    ["A", "E", "G", "I", "B"],
    ["A", "E", "F", "I", "B"],
    ["A", "D", "E", "F", "H", "J", "B"],
    ["A", "E", "F", "J", "B"],
  ];

  const benchmarkPath = ["A", "D", "K", "B"];
  const finalBestPath = ["A", "E", "F", "J", "B"];

  const part1Scenes = [
    {
      tab: "Bài toán",
      kicker: "Google Maps",
      title: "Cần đi từ A đến B",
      body: "Có nhiều tuyến đường khác nhau. Mỗi tuyến có một chi phí như thời gian, khoảng cách hoặc tiền xăng.",
      audienceTitle: "Cách đọc hình",
      audienceBullets: [
        "A là điểm xuất phát, B là điểm cần đến.",
        "Số trên mỗi đoạn đường là chi phí phải trả khi đi qua đoạn đó.",
        "Trong các tuyến đang thấy, tuyến xanh có tổng chi phí thấp nhất.",
      ],
      metricLabels: ["Tuyến ví dụ", "Chi phí từng tuyến", "Cần tìm"],
      enter: enterProblemScene,
    },
    {
      tab: "Thử tất cả",
      kicker: "Ý tưởng tự nhiên",
      title: "Đi thử tất cả",
      body: "Cứ đi hết từng tuyến từ A đến B, đo chi phí của từng tuyến, rồi chọn tuyến rẻ nhất.",
      audienceTitle: "Máy đang làm gì?",
      audienceBullets: [
        "Mỗi ô nhỏ là một tuyến từ A đến B phải đi tới cuối.",
        "Ô vàng là tuyến đang thử, ô xanh là mốc tốt nhất hiện tại.",
        "Muốn chắc chắn đúng, cách này phải làm sáng hết {ROUTES} ô.",
      ],
      metricLabels: ["Đã thử", "Đoạn đã đi", "Tốt nhất"],
      enter: enterBruteForceScene,
    },
    {
      tab: "Vì sao chậm",
      kicker: "Điểm yếu",
      title: "Quá nhiều đường",
      body: "Ta phải thử cả những nhánh dài, nhánh lặp ý tưởng, hoặc nhánh mà gần như chắc chắn không đáng đi tiếp.",
      audienceTitle: "Vấn đề xuất hiện",
      audienceBullets: [
        "Mỗi đường mờ là một khả năng phải tính chi phí.",
        "Nhiều tuyến chỉ khác nhau ở vài đoạn cuối nhưng vẫn bị thử lại.",
        "Chỉ bản đồ nhỏ này đã có {ROUTES} tuyến cần xét.",
      ],
      metricLabels: ["Số tuyến", "Việc phải làm", "Tốt nhất"],
      enter: enterSlowScene,
    },
    {
      tab: "Cắt nhánh",
      kicker: "Tối ưu đầu tiên",
      title: "Tệ hơn thì dừng",
      body: "Giả sử ta đã tìm được một đường tạm tốt có chi phí {BENCH}. Tuyến nào đang đi mà vượt {BENCH} thì dừng ngay tại đó.",
      audienceTitle: "Quy tắc cắt nhánh",
      audienceBullets: [
        "Đường xanh là mốc tốt nhất hiện tại, chưa chắc là đáp án cuối.",
        "Khung trên bản đồ so sánh chi phí đang đi với mốc {BENCH}.",
        "Nét đứt đỏ là phần đường được bỏ qua, nhưng vẫn còn rất nhiều tuyến phải xét.",
      ],
      metricLabels: ["Ví dụ", "So sánh", "Mốc"],
      enter: enterPruneRuleScene,
    },
    {
      tab: "Áp dụng",
      kicker: "Sau khi có quy tắc",
      title: "Vẫn phải quét nhiều",
      body: "Bây giờ áp dụng quy tắc cắt nhánh cho toàn bộ {ROUTES} tuyến. Nhiều tuyến dừng sớm, nhưng ta vẫn phải xét từng tuyến.",
      audienceTitle: "Hiệu quả thật sự",
      audienceBullets: [
        "Đường xanh là mốc tốt nhất hiện tại, bắt đầu từ {BENCH}.",
        "Khi tìm được đường tốt hơn, mốc xanh được thay bằng mốc mới.",
        "Số đoạn giảm mạnh, nhưng vẫn phải quét qua cả khối tuyến.",
      ],
      metricLabels: ["Đã xét", "Đoạn đã đi", "Mốc hiện tại"],
      enter: enterPruneSweepScene,
    },
    {
      tab: "Kết luận",
      kicker: "Kết phần 1",
      title: "Nhanh hơn, vẫn chậm",
      body: "Cắt nhánh đã tốt hơn việc thử tất cả, nhưng tư duy chính vẫn là thử nhiều đường. Ta cần một cách nghĩ khác.",
      audienceTitle: "Điều cần nhớ",
      audienceBullets: [
        "Thử tất cả: đúng nhưng quá tốn công.",
        "Cắt nhánh: giảm mạnh số đoạn phải đi, nhưng chưa triệt để.",
        "Câu hỏi tiếp theo: có thể chắc chắn điểm nào là tốt nhất trước?",
      ],
      metricLabels: ["So sánh", "Bước quét", "Đường tốt"],
      enter: enterConclusionScene,
    },
  ];

  const part2Scenes = [
    {
      tab: "Ngược",
      kicker: "Tư duy ngược",
      title: "Nhìn từ K",
      body: "Phần 1 cho thấy thử đường là ngõ cụt. Ta đổi cách nghĩ trên một bản đồ mới, nhỏ hơn để dễ soi từng bước: lần này cần đi từ A đến K. Trước hết hãy nhìn ngược từ đích: K có thể đến từ đâu?",
      audienceTitle: "Đảo chiều câu hỏi",
      audienceBullets: [
        "Bản đồ mới, đích mới: ta cần đi từ A đến K.",
        "Đích K chỉ nối trực tiếp với F và G.",
        "Đường tốt nhất tới K chỉ có hai dạng: tốt nhất tới F rồi thêm 4, hoặc tốt nhất tới G rồi thêm 2.",
        "Vấn đề chưa giải xong; ta chỉ vừa biến K thành hai câu hỏi nhỏ hơn.",
      ],
      metricLabels: ["Cửa vào K", "Cạnh cuối", "Đích"],
      enter: enterPart2ReverseScene,
    },
    {
      tab: "Nhỏ hơn",
      kicker: "Rút gọn",
      title: "Câu hỏi lan ngược",
      body: "Muốn biết F hoặc G, ta lại phải hỏi: trước F/G là ai? Câu hỏi cứ tự kéo ngược về gần A.",
      audienceTitle: "Câu hỏi tự kéo về A",
      audienceBullets: [
        "K phụ thuộc F/G.",
        "F và G lại phụ thuộc D/E.",
        "D/E lại phụ thuộc các điểm gần A hơn, nên câu hỏi cứ bị kéo về phía A.",
      ],
      metricLabels: ["Đang hỏi", "Ứng viên", "Cần biết"],
      enter: () => enterPart2TraceScene(0),
    },
    {
      tab: "F là đích",
      kicker: "Rút gọn",
      title: "Zoom vào F",
      body: "Tạm coi F là đích mới. Muốn tới F thì phải biết đường tốt nhất tới D hoặc E trước.",
      audienceTitle: "Lặp lại cùng câu hỏi",
      audienceBullets: [
        "G/K lùi vào nền để giữ ngữ cảnh, còn F trở thành điểm cần soi kỹ.",
        "F bây giờ đóng vai trò giống K lúc nãy.",
        "Muốn biết F, ta lại phải hỏi D/E trước.",
      ],
      metricLabels: ["Đích tạm", "Ứng viên", "Cần biết"],
      enter: () => enterPart2TraceScene(1),
    },
    {
      tab: "E là đích",
      kicker: "Rút gọn",
      title: "Zoom tiếp vào E",
      body: "F kéo ta về E. Bây giờ E lại trở thành một đích tạm thời, và câu hỏi tiếp tục lặp lại.",
      audienceTitle: "Câu hỏi kéo gần A",
      audienceBullets: [
        "Muốn biết đường tốt nhất tới E, ta cần biết A hoặc B trước.",
        "A là gốc nên đã biết chắc cost 0.",
        "B vẫn là một câu hỏi nhỏ hơn cần xử lý tiếp.",
      ],
      metricLabels: ["Đích tạm", "Ứng viên", "Gần gốc"],
      enter: () => enterPart2TraceScene(2),
    },
    {
      tab: "B là đích",
      kicker: "Rút gọn",
      title: "Thêm một lớp nữa",
      body: "B cũng lặp lại cùng cấu trúc: muốn biết tốt tới B thì phải biết A hoặc C trước.",
      audienceTitle: "Vì sao quay về A",
      audienceBullets: [
        "Mỗi lần coi một đỉnh là đích mới, ta lại hỏi các đỉnh đứng trước nó.",
        "Cứ làm vậy, câu hỏi cuối cùng kéo về gần điểm xuất phát A.",
        "Đến đây ta mới nhìn lại: bài toán hiện tại thật sự đang bắt ta giải điều gì?",
      ],
      metricLabels: ["Đích tạm", "Ứng viên", "Quay về"],
      enter: () => enterPart2TraceScene(3),
    },
    {
      tab: "Đổi bài",
      kicker: "Kết luận",
      title: "Đổi bài toán",
      body: "Truy ngược cho thấy: muốn chắc một đỉnh, phải chắc các đỉnh đứng trước nó. Mà đường tới K có thể đi qua bất kỳ đỉnh nào, nên bài toán trở thành: tìm đường ngắn nhất từ A tới từng đỉnh.",
      audienceTitle: "Bài toán mới",
      audienceBullets: [
        "Đỉnh nào cũng có thể nằm trên đường tới K, nên đỉnh nào cũng cần được trả lời.",
        "Mỗi đỉnh X: đường ngắn nhất từ A tới X là bao nhiêu?",
        "A = 0; các đỉnh còn lại chưa biết.",
      ],
      metricLabels: ["Bài toán cũ", "Bài toán mới", "Lặp lại"],
      enter: enterPart2ProblemShiftScene,
    },
    {
      tab: "Mở cạnh",
      kicker: "Từ A",
      title: "Chưa nhìn hết",
      body: "Đứng ở A, ta chỉ biết các cạnh đi ra từ A. Những phần xa hơn vẫn để mờ.",
      audienceTitle: "Bắt đầu từ điều chắc chắn",
      audienceBullets: [
        "A có chi phí 0 vì ta đang đứng ở A.",
        "Các hàng xóm trực tiếp được mở với chi phí tạm thời.",
        "Đỉnh xa hơn vẫn là chưa biết, chưa cần kết luận.",
      ],
      metricLabels: ["Đã biết", "Đang mở", "Chưa biết"],
      enter: enterPart2FrontierScene,
    },
    {
      tab: "Quiz 1",
      kicker: "Chọn đỉnh",
      title: "Chốt ai trước?",
      body: "Trong các đỉnh đang mở, hãy chọn đỉnh có thể chắc chắn ngay bây giờ.",
      audienceTitle: "Đỉnh nào đủ chắc?",
      audienceBullets: [
        "Mỗi đỉnh đang mở là một khả năng đã biết từ A.",
        "Nếu chọn một đỉnh chưa chắc, visualizer sẽ vẽ đường vòng rẻ hơn để bác bỏ.",
        "Mục tiêu không phải đoán đúng ngay, mà là thấy vì sao chỉ có một đỉnh chốt được.",
      ],
      metricLabels: ["Lựa chọn", "Phản ví dụ", "Chắc chắn"],
      enter: enterPart2FirstQuizScene,
    },
    {
      tab: "Chốt C",
      kicker: "Mở thêm",
      title: "C làm rõ hơn",
      body: "Khi C được chốt, các cạnh từ C mở ra những đường mới đi qua C. Có đường còn rẻ hơn đường cũ.",
      audienceTitle: "Sau khi chốt C",
      audienceBullets: [
        "Cạnh C -> B = 1 và C -> D = 3 vừa mở ra các đường mới đi qua C.",
        "Cộng các cạnh đang thấy trên hình là ra tổng của từng đường.",
        "Ta lặp lại đúng câu hỏi: trong phần đang mở, đỉnh nào đã chắc chắn?",
      ],
      metricLabels: ["Vừa chốt", "Cập nhật", "Chọn tiếp"],
      enter: enterPart2AfterCScene,
    },
    {
      tab: "Min",
      kicker: "Quy tắc",
      title: "Hiện cost",
      body: "Đừng chọn bằng cảm giác. Hiện toàn bộ cost đang mở rồi lấy số nhỏ nhất.",
      audienceTitle: "Quy tắc min",
      audienceBullets: [
        "Đỉnh đã chốt không bị xét lại.",
        "Đỉnh đang mở có cost nhỏ nhất là đỉnh chắc chắn tiếp theo, vì mọi cạnh mới đều làm chi phí tăng thêm.",
        "Chỉ khi chốt một đỉnh, ta mới mở tiếp hàng xóm của nó.",
      ],
      metricLabels: ["Đang mở", "Nhỏ nhất", "Hành động"],
      enter: enterPart2MinRuleScene,
    },
    {
      tab: "Tới K",
      kicker: "Chạy tiếp",
      title: "Đến đích K",
      body: "Lặp lại cùng một nhịp: chọn nhỏ nhất, chốt, rồi mở hàng xóm.",
      audienceTitle: "Nhịp chạy tới K",
      audienceBullets: [
        "E mở F và G, D không tạo đường rẻ hơn.",
        "F mở được K với cost 10.",
        "Khi K là đỉnh nhỏ nhất đang mở, đường tốt nhất đã chắc chắn.",
      ],
      metricLabels: ["Đang chốt", "Cost", "Lý do"],
      enter: enterPart2RunToKScene,
    },
    {
      tab: "Ý tưởng",
      kicker: "Kết phần 2",
      title: "Rút ra ý tưởng",
      body: "Từ câu hỏi làm sao tới K, ta đã đổi thành: giữ đường tốt nhất từ A tới từng đỉnh, rồi chốt dần những đỉnh đã chắc.",
      audienceTitle: "Ta vừa tự rút ra",
      audienceBullets: [
        "Mỗi đỉnh giữ một cost tốt nhất hiện biết từ A.",
        "Trong các đỉnh đang mở, đỉnh có cost nhỏ nhất là đỉnh chắc chắn tiếp theo.",
        "Chốt nó, mở hàng xóm, và cập nhật nếu đi qua nó rẻ hơn.",
      ],
      metricLabels: ["Đường cuối", "Tổng cost", "Dừng ở ý tưởng"],
      enter: enterPart2IdeaScene,
    },
  ];

  const part3Scenes = [
    {
      tab: "Khung",
      kicker: "Sang code",
      title: "Nghĩ rồi viết",
      body: "Ta đã có nhịp chạy trên hình. Bây giờ chỉ biến từng nhu cầu vừa thấy thành dòng mã giả, không nhảy thẳng vào công thức.",
      audienceTitle: "Code chỉ là ghi lại suy luận",
      audienceBullets: ["Hình chạy trước, code xuất hiện sau.", "Mỗi dòng code trả lời một nhu cầu vừa thấy."],
      metricLabels: ["Đang viết", "Biến cần nhớ", "Ý nghĩa"],
      enter: enterPart3FrameScene,
    },
    {
      tab: "Cost",
      kicker: "Bắt đầu",
      title: "Cần nhớ gì?",
      body: "Mỗi đỉnh cần một con số tạm thời: đường rẻ nhất hiện biết để tới nó. Vì xuất phát ở A nên A bắt đầu bằng 0, các đỉnh khác chưa biết.",
      audienceTitle: "Hai mảng đầu tiên",
      audienceBullets: ["Cost lưu con số tốt nhất hiện biết.", "Ban đầu chỉ có Cost[A] = 0."],
      metricLabels: ["Khởi tạo", "Cost", "Chưa biết"],
      enter: enterPart3CostScene,
    },
    {
      tab: "Lặp",
      kicker: "Làm lại",
      title: "Lặp nhịp",
      body: "Nhịp chọn rồi mở này phải lặp đến khi chốt hết mọi đỉnh hoặc tìm được đích. Hai điều kiện dừng đó chưa biết viết thế nào, nên cứ while (true) rồi ghi tạm hai dòng dừng bằng lời, lát nữa sửa dần thành code thật.",
      audienceTitle: "Vòng lặp",
      audienceBullets: ["Mục tiêu: chốt hết hoặc tìm được đích.", "Ghi tạm hai điều kiện dừng bằng lời, sửa dần sau."],
      metricLabels: ["Nhịp", "while", "2 chỗ dừng tạm"],
      enter: enterPart3LoopScene,
    },
    {
      tab: "Min",
      kicker: "Quét vùng mở",
      title: "Chọn nhỏ nhất",
      body: "Bắt đầu sửa dòng tạm thứ nhất: thế nào là chốt hết? Là không còn chọn được đỉnh nào nữa — vậy phải viết đoạn chọn đỉnh trước đã. Ta duyệt từng đỉnh có Cost để giữ số nhỏ nhất, nhưng nếu chỉ nhìn số thì A = 0 sẽ thắng lại.",
      audienceTitle: "Tìm min",
      audienceBullets: ["Muốn biết khi nào chốt hết, phải viết đoạn chọn đỉnh trước.", "min giữ số rẻ nhất, nhưng chưa biết bỏ qua đỉnh đã xử lý."],
      metricLabels: ["Đang quét", "Nhỏ nhất", "Sẽ chốt"],
      enter: enterPart3MinScene,
    },
    {
      tab: "Visited",
      kicker: "Không xét lại",
      title: "Nhớ đã chốt",
      body: "A vẫn có Cost 0, nhưng A không còn là ứng viên. Ta cần Visited như một cổng chặn: đã chốt thì không đi vào vòng chọn min nữa.",
      audienceTitle: "Visited",
      audienceBullets: ["Visited tách đã chốt khỏi đang mở.", "Khi quét min phải bỏ qua đỉnh đã chốt."],
      metricLabels: ["Đã chốt", "Visited", "bỏ qua"],
      enter: enterPart3VisitedScene,
    },
    {
      tab: "Hết",
      kicker: "Sửa dòng tạm 1",
      title: "Không còn ứng viên",
      body: "Giờ trả lời được câu chốt hết khi nào: nếu cả lượt quét không có đỉnh nào lọt qua, min vẫn rỗng — tức là đã chốt hết. Dòng tạm chốt hết? được sửa thành điều kiện thật: min == null.",
      audienceTitle: "min rỗng",
      audienceBullets: ["min == null chính là chốt hết.", "Nó cũng xử lý bài toán đích không tới được."],
      metricLabels: ["Quét xong", "min = null", "break"],
      enter: enterPart3EmptyScene,
    },
    {
      tab: "Đích",
      kicker: "Sửa dòng tạm 2",
      title: "Gặp K",
      body: "Còn dòng tạm tìm được đích: vì min là đỉnh sắp được chốt, nếu min chính là K thì ta đã có câu trả lời. Dòng tạm được sửa thành min == end.",
      audienceTitle: "Đích nhỏ nhất",
      audienceBullets: ["min == end chính là tìm được đích.", "K không cần bị đánh dấu Visited — ta đã có Cost[K]."],
      metricLabels: ["min", "K", "break"],
      enter: enterPart3EndScene,
    },
    {
      tab: "Chốt",
      kicker: "Không phải đích",
      title: "Chốt min",
      body: "Nếu min không phải đích, ta chốt nó. C đang rẻ nhất trong các đỉnh đang mở, nên Cost[C] đã chắc và C được đưa vào Visited.",
      audienceTitle: "Chốt",
      audienceBullets: ["Visited[min] lưu việc này.", "Sau đó mới mở hàng xóm."],
      metricLabels: ["min", "C", "Visited"],
      enter: enterPart3SettleScene,
    },
    {
      tab: "Mở kề",
      kicker: "Sau khi chốt",
      title: "Thử hàng xóm",
      body: "Sau khi chốt C, mỗi cạnh đi ra từ C tạo một gói chi phí mới. Gói đó đi tới hàng xóm và thử thay Cost hiện tại.",
      audienceTitle: "Cập nhật thô",
      audienceBullets: ["newCost = Cost[min] + cost cạnh.", "Bản đầu tiên cứ gán thử Cost[ke]."],
      metricLabels: ["min = C", "newCost", "Cập nhật"],
      enter: enterPart3RelaxNaiveScene,
    },
    {
      tab: "Rẻ hơn",
      kicker: "Sửa lỗi ghi đè",
      title: "Chỉ khi rẻ",
      body: "Cost của một đỉnh là số tốt nhất đang giữ. Nếu ô còn trống thì nhận số đầu tiên; nếu đã có số rồi thì ứng viên mới chỉ được ghi vào khi nó nhỏ hơn số đang giữ.",
      audienceTitle: "Điều kiện cập nhật",
      audienceBullets: ["Ô trống nghĩa là đỉnh chưa được mở, nên cost đầu tiên được nhận.", "Ô đã có số nghĩa là đã có một đường tới đó, nên không được ghi đè bằng số tệ hơn."],
      metricLabels: ["Đang thử", "Ứng viên", "Cost[F]"],
      enter: enterPart3RelaxGuardScene,
    },
    {
      tab: "Prev",
      kicker: "Lưu đường đi",
      title: "Nhớ điểm trước",
      body: "Cost cho biết đường ngắn nhất tốn bao nhiêu, nhưng chưa nói đi qua đâu. Để dựng lại đường, mỗi đỉnh chỉ cần nhớ cửa vào tốt nhất ngay trước nó.",
      audienceTitle: "Lưu cửa vào",
      audienceBullets: [
        "Lưu nguyên Path thì lặp lại nhiều đoạn.",
        "Prev[F] = E nghĩa là muốn tới F theo đường tốt nhất thì đi từ E sang.",
        "Mỗi lần Cost được nhận, Prev phải được nhận cùng lúc.",
      ],
      metricLabels: ["Đường đi", "Prev", "Lần ngược"],
      enter: enterPart3PrevScene,
    },
    {
      tab: "Chạy lại",
      kicker: "Ghép lại",
      title: "Đọc lại code",
      body: "Bây giờ chạy lại code từ trạng thái trống: dòng nào mở Cost thì đỉnh đó hiện, vòng lặp tự tìm tới K, rồi dùng Prev để lần ngược ra đường.",
      audienceTitle: "Nhịp cuối cùng",
      audienceBullets: ["Tìm min.", "Dừng hoặc chốt.", "Mở kề và lưu Prev."],
      metricLabels: ["Mã giả", "Cost", "Prev"],
      enter: enterPart3ReplayScene,
    },
  ];

  const part4Scenes = [
    {
      tab: "Đếm bước",
      kicker: "Độ phức tạp",
      title: "Mỗi vòng tốn bao nhiêu việc?",
      body: "Ta không học thuộc O(V²). Ta nhìn lại chính code vừa viết: mỗi lần chọn min phải quét các đỉnh, rồi mỗi đỉnh được chốt sẽ mở các cạnh kề.",
      audienceTitle: "Đếm từ code",
      audienceBullets: [
        "FOR 1: mỗi vòng nhìn lại danh sách đỉnh để tìm cost nhỏ nhất.",
        "Vòng đó lặp nhiều lần, nên phần quét đỉnh tạo ra V x V.",
        "FOR 2: cộng thêm lượng cạnh kề được mở trong cả quá trình.",
      ],
      metricLabels: ["Vòng", "FOR 1", "FOR 2"],
      enter: enterPart4ComplexityScene,
    },
    {
      tab: "Tối ưu min",
      kicker: "Cấu trúc dữ liệu",
      title: "Điểm chậm nằm ở chọn min",
      body: "Nếu ta có một cấu trúc luôn để cost nhỏ nhất ở đầu, việc chọn min không còn phải nhìn lại toàn bộ đỉnh mỗi vòng.",
      audienceTitle: "Tối ưu tự nhiên",
      audienceBullets: [
        "Bản mảng: hỏi min là quét lại các đỉnh đang mở.",
        "Hàng đợi ưu tiên (priority queue) giữ ứng viên theo cost, lấy min nhanh hơn.",
        "Độ phức tạp thường viết thành O((V + E) log V).",
      ],
      metricLabels: ["Bản mảng", "Hàng đợi ưu tiên", "Giảm ở min"],
      enter: enterPart4HeapScene,
    },
    {
      tab: "Cạnh âm",
      kicker: "Giới hạn",
      title: "Khi cost âm phá lời hứa",
      body: "Thuật toán của ta đúng vì khi đã chốt một đỉnh, ta tin không có đường đi muộn nào kéo nó xuống thấp hơn. Cạnh âm phá đúng niềm tin đó.",
      audienceTitle: "Điều kiện cần",
      audienceBullets: [
        "Thuật toán chốt sớm đường ngắn nhất đến một đỉnh.",
        "Nếu cạnh âm xuất hiện muộn, cost của đỉnh đã chốt có thể giảm.",
        "Vì vậy thuật toán cần đồ thị không có cạnh âm.",
      ],
      metricLabels: ["Đang xét", "Cost[B]", "Đường đúng"],
      enter: enterPart4NegativeScene,
    },
    {
      tab: "Tên gọi",
      kicker: "Kết bài",
      title: "Đó chính là Dijkstra",
      body: "Ta vừa xây thuật toán từ các câu hỏi rất đời thường. Tên Dijkstra chỉ đến sau khi ý tưởng đã tự hiện ra.",
      audienceTitle: "Điều cần nhớ",
      audienceBullets: [
        "Không cần bắt đầu bằng công thức hay tên thuật toán.",
        "Luật cốt lõi: chốt đỉnh đang mở có cost nhỏ nhất.",
        "Dijkstra là tên gọi của ý tưởng ta vừa tự suy luận được.",
      ],
      metricLabels: ["Tên gọi", "Điều kiện", "Độ phức tạp"],
      enter: enterPart4FinalScene,
    },
  ];

  const parts = [
    {
      id: "part1",
      label: "Phần 1",
      title: "Google Maps tìm đường như thế nào?",
      graph: graphProfiles.part1,
      scenes: part1Scenes,
      lastScene: 0,
    },
    {
      id: "part2",
      label: "Phần 2",
      title: "Tư duy ngược tìm đường",
      graph: graphProfiles.part2,
      scenes: part2Scenes,
      lastScene: 0,
    },
    {
      id: "part3",
      label: "Phần 3",
      title: "Từ ý tưởng thành mã giả",
      graph: graphProfiles.part2,
      scenes: part3Scenes,
      lastScene: 0,
    },
    {
      id: "part4",
      label: "Phần 4",
      title: "Độ phức tạp và giới hạn",
      graph: graphProfiles.part2,
      scenes: part4Scenes,
      lastScene: 0,
    },
  ];

  const part2NodeOrder = ["A", "C", "B", "D", "E", "F", "G", "K"];
  const part2FinalPath = ["A", "C", "B", "E", "F", "K"];
  const part2Edges = {
    fromA: [
      ["A", "C"],
      ["A", "B"],
      ["A", "D"],
      ["A", "E"],
    ],
    fromC: [
      ["C", "B"],
      ["C", "D"],
    ],
    fromB: [["B", "E"]],
    fromE: [
      ["E", "F"],
      ["E", "G"],
    ],
    fromD: [
      ["D", "F"],
      ["D", "G"],
    ],
    toK: [
      ["F", "K"],
      ["G", "K"],
    ],
  };

  const part2EdgeLabelPlacements = {
    "A:C": { t: 0.58, n: 0 },
    "A:B": { t: 0.42, n: 0 },
    "A:D": { t: 0.55, n: 0 },
    "A:E": { t: 0.5, n: 0 },
    "B:C": { t: 0.38, n: 0 },
    "C:D": { t: 0.52, n: 0 },
    "B:E": { t: 0.58, n: 0 },
    "E:F": { t: 0.5, n: 0 },
    "E:G": { t: 0.54, n: 0 },
    "D:F": { t: 0.48, n: 0 },
    "D:G": { t: 0.56, n: 0 },
    "F:K": { t: 0.52, n: 0 },
    "G:K": { t: 0.52, n: 0 },
  };

  const part2Cameras = {
    aTight: { center: { x: 150, y: 350 }, scale: 1.9 },
    frontier: { center: { x: 294, y: 348 }, scale: 1.36 },
    middle: { center: { x: 442, y: 388 }, scale: 1.12 },
    toK: { center: { x: 548, y: 386 }, scale: 1.02 },
    full: { center: { x: 500, y: 380 }, scale: 0.96 },
  };

  const part2States = {
    start: makePart2State({
      A: ["settled", 0, "-"],
      C: ["open", 2, "A"],
      B: ["open", 4, "A"],
      D: ["open", 7, "A"],
      E: ["open", 6, "A"],
      F: ["unknown", null, "-"],
      G: ["unknown", null, "-"],
      K: ["unknown", null, "-"],
    }),
    afterC: makePart2State({
      A: ["settled", 0, "-"],
      C: ["settled", 2, "A"],
      B: ["open", 3, "C"],
      D: ["open", 5, "C"],
      E: ["open", 6, "A"],
      F: ["unknown", null, "-"],
      G: ["unknown", null, "-"],
      K: ["unknown", null, "-"],
    }),
    afterB: makePart2State({
      A: ["settled", 0, "-"],
      C: ["settled", 2, "A"],
      B: ["settled", 3, "C"],
      D: ["open", 5, "C"],
      E: ["open", 4, "B"],
      F: ["unknown", null, "-"],
      G: ["unknown", null, "-"],
      K: ["unknown", null, "-"],
    }),
    afterE: makePart2State({
      A: ["settled", 0, "-"],
      C: ["settled", 2, "A"],
      B: ["settled", 3, "C"],
      D: ["open", 5, "C"],
      E: ["settled", 4, "B"],
      F: ["open", 6, "E"],
      G: ["open", 9, "E"],
      K: ["unknown", null, "-"],
    }),
    afterD: makePart2State({
      A: ["settled", 0, "-"],
      C: ["settled", 2, "A"],
      B: ["settled", 3, "C"],
      D: ["settled", 5, "C"],
      E: ["settled", 4, "B"],
      F: ["open", 6, "E"],
      G: ["open", 9, "E"],
      K: ["unknown", null, "-"],
    }),
    afterF: makePart2State({
      A: ["settled", 0, "-"],
      C: ["settled", 2, "A"],
      B: ["settled", 3, "C"],
      D: ["settled", 5, "C"],
      E: ["settled", 4, "B"],
      F: ["settled", 6, "E"],
      G: ["open", 9, "E"],
      K: ["open", 10, "F"],
    }),
    afterG: makePart2State({
      A: ["settled", 0, "-"],
      C: ["settled", 2, "A"],
      B: ["settled", 3, "C"],
      D: ["settled", 5, "C"],
      E: ["settled", 4, "B"],
      F: ["settled", 6, "E"],
      G: ["settled", 9, "E"],
      K: ["open", 10, "F"],
    }),
    final: makePart2State({
      A: ["settled", 0, "-"],
      C: ["settled", 2, "A"],
      B: ["settled", 3, "C"],
      D: ["settled", 5, "C"],
      E: ["settled", 4, "B"],
      F: ["settled", 6, "E"],
      G: ["settled", 9, "E"],
      K: ["settled", 10, "F"],
    }),
  };

  const part3LoopCamera = { center: { x: 278, y: 392 }, scale: 1.28 };
  const part3GuardCamera = { center: { x: 360, y: 382 }, scale: 1.06 };
  const part3CostSlotCamera = { center: { x: 550, y: 330 }, scale: 1.12 };
  // Cửa vào (trái) và ô giữ số (phải) trên bảng quyết định Cost[F] — dùng chung
  // cho cả scene "Chỉ khi rẻ" và scene "Prev" để bảng hiện lại đúng chỗ quen.
  const GUARD_CHIP_HOME = { x: -96, y: 40 };
  const GUARD_SLOT_POS = { x: 96, y: 40 };
  // Offset of the floating "min" holder card from the node it currently holds.
  // Kept constant so the card can slide between nodes while its tether + anchor
  // halo keep pointing at whichever node sits below it.
  const MIN_HOLDER_DX = 110;
  const MIN_HOLDER_DY = -26;
  const part3AllEdges = [part2Edges.fromA, part2Edges.fromC, part2Edges.fromB, part2Edges.fromE, part2Edges.fromD, part2Edges.toK];
  const part3AfterCSettledState = makePart2State({
    A: ["settled", 0, "-"],
    C: ["settled", 2, "A"],
    B: ["open", 4, "A"],
    D: ["open", 7, "A"],
    E: ["open", 6, "A"],
    F: ["unknown", null, "-"],
    G: ["unknown", null, "-"],
    K: ["unknown", null, "-"],
  });
  const part3NoFrontierState = makePart2State({
    A: ["settled", 0, "-"],
    C: ["settled", 2, "A"],
    B: ["settled", 3, "C"],
    D: ["settled", 5, "C"],
    E: ["settled", 4, "B"],
    F: ["settled", 6, "E"],
    G: ["settled", 9, "E"],
    K: ["unknown", null, "-"],
  });

  const part3EndReadyState = makePart2State({
    A: ["settled", 0, "-"],
    C: ["settled", 2, "A"],
    B: ["settled", 3, "C"],
    D: ["settled", 5, "C"],
    E: ["settled", 4, "B"],
    F: ["settled", 6, "E"],
    G: ["settled", 9, "E"],
    K: ["open", 10, "F"],
  });

  const part3CodeStates = {
    frame: {
      lines: ["function NganNhat(map, start, end) {", "}"],
      inserted: [1, 2],
      active: [1, 2],
    },
    cost: {
      lines: ["function NganNhat(map, start, end) {", "  Cost = []", "  Cost[start] = 0", "}"],
      inserted: [2, 3],
      active: [2, 3],
    },
    // Theo đúng nhịp dẫn dắt: viết khung while với HAI ĐIỀU KIỆN DỪNG TẠM
    // bằng lời trước ("chốt hết?", "tìm được đích?"), các bước sau mới quay
    // lại sửa dần từng dòng tạm đó thành code thật.
    loop: {
      lines: [
        "function NganNhat(map, start, end) {",
        "  Cost = []",
        "  Cost[start] = 0",
        "  while (true) {",
        "    if (chốt hết?) break",
        "    if (tìm được đích?) break",
        "  }",
        "}",
      ],
      inserted: [4, 5, 6, 7],
      active: [4, 5, 6],
    },
    min: {
      lines: [
        "function NganNhat(map, start, end) {",
        "  Cost = []",
        "  Cost[start] = 0",
        "  while (true) {",
        "    min = null",
        "    for (dinh in map) {",
        "      if (Cost[dinh] != null) {",
        "        if (min == null || Cost[dinh] < Cost[min]) {",
        "          min = dinh",
        "        }",
        "      }",
        "    }",
        "    if (chốt hết?) break",
        "    if (tìm được đích?) break",
        "  }",
        "}",
      ],
      inserted: [5, 6, 7, 8, 9, 10, 11, 12],
      active: [5, 6, 7, 8, 9],
    },
    visited: {
      lines: [
        "function NganNhat(map, start, end) {",
        "  Cost = []",
        "  Visited = []",
        "  Cost[start] = 0",
        "  while (true) {",
        "    min = null",
        "    for (dinh in map) {",
        "      if (Cost[dinh] != null && !Visited[dinh]) {",
        "        if (min == null || Cost[dinh] < Cost[min]) {",
        "          min = dinh",
        "        }",
        "      }",
        "    }",
        "    if (chốt hết?) break",
        "    if (tìm được đích?) break",
        "  }",
        "}",
      ],
      inserted: [3],
      changed: [8],
      active: [3, 8],
    },
    empty: {
      lines: [
        "function NganNhat(map, start, end) {",
        "  Cost = []",
        "  Visited = []",
        "  Cost[start] = 0",
        "  while (true) {",
        "    min = null",
        "    for (dinh in map) {",
        "      if (Cost[dinh] != null && !Visited[dinh]) {",
        "        if (min == null || Cost[dinh] < Cost[min]) {",
        "          min = dinh",
        "        }",
        "      }",
        "    }",
        "    if (min == null) break",
        "    if (tìm được đích?) break",
        "  }",
        "}",
      ],
      changed: [14],
      active: [14],
    },
    end: {
      lines: [
        "function NganNhat(map, start, end) {",
        "  Cost = []",
        "  Visited = []",
        "  Cost[start] = 0",
        "  while (true) {",
        "    min = null",
        "    for (dinh in map) {",
        "      if (Cost[dinh] != null && !Visited[dinh]) {",
        "        if (min == null || Cost[dinh] < Cost[min]) {",
        "          min = dinh",
        "        }",
        "      }",
        "    }",
        "    if (min == null) break",
        "    if (min == end) break",
        "  }",
        "}",
      ],
      changed: [15],
      active: [15],
    },
    settle: {
      lines: [
        "function NganNhat(map, start, end) {",
        "  Cost = []",
        "  Visited = []",
        "  Cost[start] = 0",
        "  while (true) {",
        "    min = null",
        "    for (dinh in map) {",
        "      if (Cost[dinh] != null && !Visited[dinh]) {",
        "        if (min == null || Cost[dinh] < Cost[min]) {",
        "          min = dinh",
        "        }",
        "      }",
        "    }",
        "    if (min == null) break",
        "    if (min == end) break",
        "    Visited[min] = true",
        "  }",
        "}",
      ],
      inserted: [16],
      active: [16],
    },
    relaxNaive: {
      lines: [
        "function NganNhat(map, start, end) {",
        "  Cost = []",
        "  Visited = []",
        "  Cost[start] = 0",
        "  while (true) {",
        "    min = null",
        "    for (dinh in map) {",
        "      if (Cost[dinh] != null && !Visited[dinh]) {",
        "        if (min == null || Cost[dinh] < Cost[min]) {",
        "          min = dinh",
        "        }",
        "      }",
        "    }",
        "    if (min == null) break",
        "    if (min == end) break",
        "    Visited[min] = true",
        "    for (canh of map[min]) {",
        "      ke = canh.to",
        "      newCost = Cost[min] + canh.cost",
        "      Cost[ke] = newCost",
        "    }",
        "  }",
        "}",
      ],
      inserted: [17, 18, 19, 20, 21],
      active: [17, 19, 20],
    },
    relaxGuard: {
      lines: [
        "function NganNhat(map, start, end) {",
        "  Cost = []",
        "  Visited = []",
        "  Cost[start] = 0",
        "  while (true) {",
        "    min = null",
        "    for (dinh in map) {",
        "      if (Cost[dinh] != null && !Visited[dinh]) {",
        "        if (min == null || Cost[dinh] < Cost[min]) {",
        "          min = dinh",
        "        }",
        "      }",
        "    }",
        "    if (min == null) break",
        "    if (min == end) break",
        "    Visited[min] = true",
        "    for (canh of map[min]) {",
        "      ke = canh.to",
        "      newCost = Cost[min] + canh.cost",
        "      if (Cost[ke] == null || newCost < Cost[ke]) {",
        "        Cost[ke] = newCost",
        "      }",
        "    }",
        "  }",
        "}",
      ],
      inserted: [20, 22],
      changed: [21],
      active: [20, 21, 22],
    },
    prev: {
      lines: [
        "function NganNhat(map, start, end) {",
        "  Cost = []",
        "  Visited = []",
        "  Prev = []",
        "  Cost[start] = 0",
        "  while (true) {",
        "    min = null",
        "    for (dinh in map) {",
        "      if (Cost[dinh] != null && !Visited[dinh]) {",
        "        if (min == null || Cost[dinh] < Cost[min]) {",
        "          min = dinh",
        "        }",
        "      }",
        "    }",
        "    if (min == null) break",
        "    if (min == end) break",
        "    Visited[min] = true",
        "    for (canh of map[min]) {",
        "      ke = canh.to",
        "      newCost = Cost[min] + canh.cost",
        "      if (Cost[ke] == null || newCost < Cost[ke]) {",
        "        Cost[ke] = newCost",
        "        Prev[ke] = min",
        "      }",
        "    }",
        "  }",
        "  return { cost: Cost[end], prev: Prev }",
        "}",
      ],
      inserted: [4, 23, 27],
      active: [4, 23, 27],
    },
    replay: {
      lines: [
        "function NganNhat(map, start, end) {",
        "  Cost = []",
        "  Visited = []",
        "  Prev = []",
        "  Cost[start] = 0",
        "  while (true) {",
        "    min = null",
        "    for (dinh in map) {",
        "      if (Cost[dinh] != null && !Visited[dinh]) {",
        "        if (min == null || Cost[dinh] < Cost[min]) {",
        "          min = dinh",
        "        }",
        "      }",
        "    }",
        "    if (min == null) break",
        "    if (min == end) break",
        "    Visited[min] = true",
        "    for (canh of map[min]) {",
        "      ke = canh.to",
        "      newCost = Cost[min] + canh.cost",
        "      if (Cost[ke] == null || newCost < Cost[ke]) {",
        "        Cost[ke] = newCost",
        "        Prev[ke] = min",
        "      }",
        "    }",
        "  }",
        "  return { cost: Cost[end], prev: Prev }",
        "}",
      ],
      inserted: [],
      active: [6, 7, 8, 9, 10, 11, 15, 16, 17, 18, 21, 22, 23, 27],
      compact: false,
    },
  };

  const part3CodeBuildOrder = [
    "frame",
    "cost",
    "loop",
    "min",
    "visited",
    "empty",
    "end",
    "settle",
    "relaxNaive",
    "relaxGuard",
    "prev",
    "replay",
  ];

  const part4Order = ["A", "B", "C", "D", "E", "F"];
  const part4ComplexityDemoRounds = 2;
  const part4Nodes = {
    A: { x: 110, y: 335 },
    B: { x: 285, y: 150 },
    C: { x: 285, y: 520 },
    D: { x: 520, y: 150 },
    E: { x: 520, y: 520 },
    F: { x: 710, y: 335 },
  };
  const part4Edges = [
    ["A", "B", 4],
    ["A", "C", 1],
    ["B", "C", 2],
    ["B", "D", 5],
    ["B", "E", 1],
    ["C", "E", 3],
    ["D", "F", 1],
    ["E", "D", 2],
    ["E", "F", 6],
  ];
  const part4Adjacency = part4Order.reduce((acc, node) => {
    acc[node] = [];
    return acc;
  }, {});
  part4Edges.forEach(([from, to, cost]) => {
    part4Adjacency[from].push({ from, to, cost });
    part4Adjacency[to].push({ from: to, to: from, cost });
  });
  part4Order.forEach((node) => part4Adjacency[node].sort((a, b) => a.to.localeCompare(b.to)));

  const part4CodeLineKeys = [
    "fn",
    "costArray",
    "visitedArray",
    "prevArray",
    "seedCost",
    "while",
    "min",
    "for1",
    "ifMin",
    "ifMinBetter",
    "setMin",
    "closeIfMinBetter",
    "closeIfMinReachable",
    "closeFor1",
    "empty",
    "end",
    "closeOpen",
    "for2",
    "setKe",
    "newCost",
    "ifRelax",
    "setDist",
    "setPrev",
    "closeIfRelax",
    "closeFor2",
    "closeWhile",
    "return",
    "fnClose",
  ];
  const part4CodeLines = part3CodeStates.replay.lines.map((text, index) => ({
    key: part4CodeLineKeys[index] || `line${index + 1}`,
    text,
  }));

  const part4NegativeStepLabels = [
    "Khởi tạo Cost[A] = 0",
    "Mở các cạnh đi ra từ A",
    "B bị chốt quá sớm",
    "Cạnh âm tạo đường tốt hơn",
    "Kết luận: lời hứa bị phá",
  ];

  const part4NegativeStates = [
    {
      title: "Khởi tạo",
      text: "Ta muốn tìm đường ngắn nhất từ A đến B. Ban đầu chỉ A có Cost 0.",
      dist: { A: 0, B: Infinity, C: Infinity },
      node: { A: "source" },
      edge: {},
      statuses: { A: "gốc", B: "đang mở", C: "đang mở" },
      result: "Chưa có kết quả cho B.",
      dijkstraB: "?",
      showTruth: false,
      compare: "Cạnh âm chưa làm hỏng gì ở bước đầu. Nó chỉ trở thành vấn đề khi xuất hiện sau lúc B đã bị chốt.",
      callout: "Luật ta vừa xây: đỉnh đã được chốt là nhỏ nhất thì không bị mở lại nữa.",
      resultTone: "",
    },
    {
      title: "Mở cạnh từ A",
      text: "Từ A ta thấy B có Cost 2 và C có Cost 5. Trong các đỉnh đang mở, B nhỏ nhất.",
      dist: { A: 0, B: 2, C: 5 },
      node: { A: "final", B: "frontier", C: "frontier" },
      edge: { AB: "active", AC: "active" },
      statuses: { A: "đã chốt", B: "đang mở · 2", C: "đang mở · 5" },
      result: "B đang có Cost tạm thời 2.",
      dijkstraB: "2",
      showTruth: false,
      compare: "Nếu mọi cạnh không âm, không có đường đi muộn nào có thể kéo B xuống dưới 2.",
      callout: "Sau A: Cost[B] = 2, Cost[C] = 5. Thuật toán chuẩn bị chốt B vì 2 < 5.",
      resultTone: "good",
    },
    {
      title: "Chốt B quá sớm",
      text: "Thuật toán chốt B vì B có Cost nhỏ nhất trong các đỉnh đang mở. B coi như xong, không được cập nhật nữa.",
      dist: { A: 0, B: 2, C: 5 },
      node: { A: "final", B: "locked", C: "frontier" },
      edge: { AB: "good" },
      statuses: { A: "đã chốt", B: "đã chốt / khoá", C: "đang mở · 5" },
      result: "Thuật toán tạm tin Cost[B] = 2 là đáp án cuối.",
      dijkstraB: "2",
      showTruth: false,
      compare: "Đây chính là lời hứa của luật chốt sớm: đã chốt thì không quay lại.",
      callout: "B đã bị khóa. Nếu sau này có đường tốt hơn đến B, thuật toán vẫn bỏ qua.",
      resultTone: "",
    },
    {
      title: "Cạnh âm xuất hiện muộn",
      text: "Sau đó thuật toán mới xét C. Cạnh C -> B có trọng số -4, nên A -> C -> B có cost 5 + (-4) = 1.",
      dist: { A: 0, B: 2, C: 5 },
      node: { A: "final", B: "locked", C: "current" },
      edge: { CB: "failed" },
      statuses: { A: "đã chốt", B: "đã chốt / không mở lại", C: "đang xét" },
      result: "Có đề xuất tốt hơn cho B: 1, nhưng B đã chốt.",
      dijkstraB: "2",
      showTruth: true,
      compare: "Nếu được cập nhật lại, B phải thành 1. Nhưng thuật toán không cập nhật đỉnh đã chốt.",
      callout: "Cạnh âm đề xuất Cost[B] = Cost[C] + (-4) = 1, nhỏ hơn 2. Đây là lúc thuật toán gãy.",
      resultTone: "",
    },
    {
      title: "Kết luận",
      text: "Thuật toán trả A -> B với cost 2, trong khi đường thật ngắn nhất là A -> C -> B với cost 1.",
      dist: { A: 0, B: 2, C: 5 },
      node: { A: "final", B: "wrong", C: "frontier" },
      edge: { AB: "bad", AC: "good", CB: "good" },
      statuses: { A: "đã chốt", B: "sai / đáng ra là 1", C: "đường đúng đi qua C" },
      result: "Sai: thuật toán giữ 2, đáp án đúng là 1.",
      dijkstraB: "2",
      showTruth: true,
      compare: "Cốt lõi: thuật toán cần mọi cạnh không âm để đảm bảo đỉnh nhỏ nhất hiện tại không thể bị cải thiện bởi đường đi xuất hiện muộn.",
      callout: "Không phải code sai. Giả định nền tảng của luật chốt sớm đã bị cạnh âm phá vỡ.",
      resultTone: "bad",
    },
  ];

  const el = {
    svg: document.getElementById("graphSvg"),
    presenterGrid: document.querySelector(".presenter-grid"),
    stageShell: document.querySelector(".stage-shell"),
    cameraLayer: document.getElementById("cameraLayer"),
    mapTexture: document.getElementById("mapTexture"),
    baseEdges: document.getElementById("baseEdges"),
    routeCloud: document.getElementById("routeCloud"),
    activeRouteLayer: document.getElementById("activeRouteLayer"),
    cutLayer: document.getElementById("cutLayer"),
    edgeLabels: document.getElementById("edgeLabels"),
    nodeLayer: document.getElementById("nodeLayer"),
    annotationLayer: document.getElementById("annotationLayer"),
    brandKicker: document.getElementById("brandKicker"),
    brandTitle: document.getElementById("brandTitle"),
    partSwitcher: document.getElementById("partSwitcher"),
    sceneTabs: document.getElementById("sceneTabs"),
    sceneKicker: document.getElementById("sceneKicker"),
    sceneTitle: document.getElementById("sceneTitle"),
    sceneBody: document.getElementById("sceneBody"),
    audienceTitle: document.getElementById("audienceTitle"),
    audienceBullets: document.getElementById("audienceBullets"),
    routeList: document.getElementById("routeList"),
    routeCountLabel: document.getElementById("routeCountLabel"),
    currentRouteLabel: document.getElementById("currentRouteLabel"),
    currentCostLabel: document.getElementById("currentCostLabel"),
    bestCostLabel: document.getElementById("bestCostLabel"),
    currentRouteMetricLabel: document.getElementById("currentRouteMetricLabel"),
    currentCostMetricLabel: document.getElementById("currentCostMetricLabel"),
    bestCostMetricLabel: document.getElementById("bestCostMetricLabel"),
    metricStrip: document.querySelector(".metric-strip"),
    workbench: document.getElementById("workbench"),
    workbenchKicker: document.getElementById("workbenchKicker"),
    workbenchTitle: document.getElementById("workbenchTitle"),
    workbenchStatus: document.getElementById("workbenchStatus"),
    workloadGrid: document.getElementById("workloadGrid"),
    workloadProgressFill: document.getElementById("workloadProgressFill"),
    workloadCompare: document.getElementById("workloadCompare"),
    bruteBar: document.getElementById("bruteBar"),
    prunedBar: document.getElementById("prunedBar"),
    bruteSegmentsLabel: document.getElementById("bruteSegmentsLabel"),
    prunedSegmentsLabel: document.getElementById("prunedSegmentsLabel"),
    pruneLens: document.getElementById("pruneLens"),
    pruneDecision: document.getElementById("pruneDecision"),
    pruneCurrentCost: document.getElementById("pruneCurrentCost"),
    pruneOperator: document.getElementById("pruneOperator"),
    pruneBestCost: document.getElementById("pruneBestCost"),
    prunePrefix: document.getElementById("prunePrefix"),
    pruneRemaining: document.getElementById("pruneRemaining"),
    pruneReason: document.getElementById("pruneReason"),
    comparisonPanel: document.getElementById("comparisonPanel"),
    bruteCount: document.getElementById("bruteCount"),
    pruneCount: document.getElementById("pruneCount"),
    codePanel: document.getElementById("codePanel"),
    codePanelTitle: document.getElementById("codePanelTitle"),
    codePanelStatus: document.getElementById("codePanelStatus"),
    codeBlock: document.getElementById("codeBlock"),
    codeNote: document.getElementById("codeNote"),
    memoryPanel: document.getElementById("memoryPanel"),
    costMemory: document.getElementById("costMemory"),
    visitedMemory: document.getElementById("visitedMemory"),
    prevMemory: document.getElementById("prevMemory"),
    part4Workspace: document.getElementById("part4Workspace"),
    part4ComplexityView: document.getElementById("part4ComplexityView"),
    part4HeapView: document.getElementById("part4HeapView"),
    part4NegativeView: document.getElementById("part4NegativeView"),
    part4FinalView: document.getElementById("part4FinalView"),
    part4CodePhase: document.getElementById("part4CodePhase"),
    part4CodeStatus: document.getElementById("part4CodeStatus"),
    part4CodeBlock: document.getElementById("part4CodeBlock"),
    part4PhaseTitle: document.getElementById("part4PhaseTitle"),
    part4PhaseBadge: document.getElementById("part4PhaseBadge"),
    part4GraphSvg: document.getElementById("part4GraphSvg"),
    part4OverlayTitle: document.getElementById("part4OverlayTitle"),
    part4OverlayText: document.getElementById("part4OverlayText"),
    part4ScanStrip: document.getElementById("part4ScanStrip"),
    part4Formula: document.getElementById("part4Formula"),
    part4FormulaNote: document.getElementById("part4FormulaNote"),
    part4RoundCounter: document.getElementById("part4RoundCounter"),
    part4ScanCounter: document.getElementById("part4ScanCounter"),
    part4EdgeCounter: document.getElementById("part4EdgeCounter"),
    part4BackButton: document.getElementById("part4BackButton"),
    part4ResetButton: document.getElementById("part4ResetButton"),
    part4TreeButton: document.getElementById("part4TreeButton"),
    part4DistTable: document.getElementById("part4DistTable"),
    part4Result: document.getElementById("part4Result"),
    part4ArrayBar: document.getElementById("part4ArrayBar"),
    part4HeapBar: document.getElementById("part4HeapBar"),
    part4ArrayRow: document.getElementById("part4ArrayRow"),
    part4HeapStack: document.getElementById("part4HeapStack"),
    part4NegativeTitle: document.getElementById("part4NegativeTitle"),
    part4NegativeText: document.getElementById("part4NegativeText"),
    part4NegativeSteps: document.getElementById("part4NegativeSteps"),
    part4NegativeResult: document.getElementById("part4NegativeResult"),
    part4NegativeDijkstra: document.getElementById("part4NegativeDijkstra"),
    part4NegativeResultText: document.getElementById("part4NegativeResultText"),
    part4NegativeCallout: document.getElementById("part4NegativeCallout"),
    part4NegativeDistGrid: document.getElementById("part4NegativeDistGrid"),
    part4NegativeCompare: document.getElementById("part4NegativeCompare"),
    progressFill: document.getElementById("progressFill"),
    prevButton: document.getElementById("prevButton"),
    replayButton: document.getElementById("replayButton"),
    pauseButton: document.getElementById("pauseButton"),
    nextButton: document.getElementById("nextButton"),
  };

  let currentPartIndex = 0;
  let currentScene = 0;
  let activeTimeline = null;
  let bestRouteElement = null;
  let activeRouteTween = null;
  let ghostRouteTween = null;
  let activeNodeClickHandler = null;
  let pendingCodeReveal = false;
  let pendingCodePayload = null;
  let pendingVisualAdvance = null;
  let pendingVisualLabel = null;
  let pendingTimelineResume = false;
  let visualAdvanceBlocked = false;
  let partTransitionActive = false;
  let activeCodeRevealTween = null;
  let paused = false;
  let allRoutes = [];
  let exhaustiveRoutes = [];
  let pruningRoutes = [];
  let part1RouteTotal = 0;
  let part1BenchmarkCost = 0;
  let demoScanRoutes = [];
  let pathIndex = new Map();
  let adjacency = new Map();
  let part4ComplexityState = null;
  let part4ComplexityHistory = [];
  let part4NegativeIndex = 0;

  init();

  function init() {
    renderMapTexture();
    renderPartSwitcher();
    bindControls();
    switchPart(getInitialPartIndex(), true);
  }

  function buildGraphIndex() {
    pathIndex = new Map();
    adjacency = new Map();
    edges.forEach(([from, to, cost]) => {
      pathIndex.set(edgeKey(from, to), cost);
      if (!adjacency.has(from)) adjacency.set(from, []);
      if (!adjacency.has(to)) adjacency.set(to, []);
      adjacency.get(from).push({ node: to, cost });
      adjacency.get(to).push({ node: from, cost });
    });
  }

  function buildPart1RouteData() {
    const discoveredRoutes = findAllRoutes("A", "B", 11);
    exhaustiveRoutes = orderRoutesForExhaustive(discoveredRoutes);
    pruningRoutes = orderRoutesForPruning(discoveredRoutes);
    allRoutes = [...discoveredRoutes].sort((a, b) => a.cost - b.cost);
    demoScanRoutes = demoScanRoutePaths.map((path) => ({ path, cost: routeCost(path) }));
    part1RouteTotal = discoveredRoutes.length;
    part1BenchmarkCost = routeCost(benchmarkPath);
  }

  function applyPartGraph(part) {
    nodes = part.graph.nodes;
    edges = part.graph.edges;
    buildGraphIndex();
    if (part.id === "part1") buildPart1RouteData();
    clearLayer(el.baseEdges);
    clearLayer(el.edgeLabels);
    clearLayer(el.nodeLayer);
    renderBaseEdges();
    renderNodes();
  }

  function renderMapTexture() {
    const roads = [
      "M36 126 C190 92 276 134 412 106 S720 70 964 112",
      "M14 520 C152 470 292 520 414 456 S668 384 994 430",
      "M108 44 C146 190 122 266 186 406 S254 548 348 618",
      "M470 24 C448 174 480 260 456 382 S412 520 452 628",
      "M654 28 C628 158 670 262 644 414 S670 550 630 628",
      "M848 40 C830 172 876 252 832 396 S832 526 900 624",
      "M76 268 C230 284 340 232 492 278 S746 312 944 272",
      "M226 626 C312 502 372 478 498 474 S716 502 962 560",
      "M22 382 C150 360 240 388 356 364 S596 292 986 340",
      "M316 22 C356 132 332 194 384 302 S476 470 554 612",
    ];

    roads.forEach((d, index) => {
      el.mapTexture.appendChild(
        svg("path", {
          d,
          class: index % 3 === 0 ? "map-road map-road-thin" : "map-road",
        }),
      );
    });
  }

  function renderBaseEdges() {
    edges.forEach(([from, to, cost]) => {
      const a = nodes[from];
      const b = nodes[to];
      const d = linePath(from, to);
      const labelPlacement = getEdgeLabelPlacement(from, to);
      const labelPoint = pointBetween(a, b, labelPlacement.t);
      const normal = lineNormal(a, b);
      const labelX = labelPoint.x + normal.x * labelPlacement.n;
      const labelY = labelPoint.y + normal.y * labelPlacement.n;
      const labelText = String(cost);
      const labelWidth = Math.max(32, labelText.length * 10 + 18);

      const group = svg("g", {
        class: "edge-group",
        "data-edge": edgeKey(from, to),
      });
      group.appendChild(svg("path", { d, class: "edge-underlay" }));
      group.appendChild(svg("path", { d, class: "edge-line" }));

      const key = edgeKey(from, to);
      const labelGroup = svg("g", { class: "edge-label-group", transform: `translate(${labelX} ${labelY})`, "data-edge": key });
      labelGroup.appendChild(svg("rect", { x: -labelWidth / 2, y: -12, width: labelWidth, height: 24, rx: 7, class: "edge-label-bg" }));
      const label = svg("text", { x: 0, y: 1, class: "edge-label" });
      label.textContent = labelText;
      labelGroup.appendChild(label);
      el.baseEdges.appendChild(group);
      el.edgeLabels.appendChild(labelGroup);
    });
  }

  function renderNodes() {
    const terminalNodes = new Set(getActivePart().graph.terminalNodes);
    Object.entries(nodes).forEach(([id, point]) => {
      const group = svg("g", {
        class: `node-group node-${id}${terminalNodes.has(id) ? " is-terminal" : ""}`,
        transform: `translate(${point.x} ${point.y})`,
        "data-node": id,
      });
      group.appendChild(svg("circle", { r: 30, class: "node-halo" }));
      group.appendChild(svg("circle", { r: 18, class: "node-dot" }));
      const label = svg("text", { x: 0, y: 1, class: "node-label" });
      label.textContent = id;
      group.appendChild(label);
      const costBadge = svg("g", { class: "node-cost-badge", transform: "translate(-29 -29)", "aria-hidden": "true" });
      costBadge.appendChild(svg("rect", { x: -15, y: -12, width: 30, height: 24, rx: 7, class: "node-cost-bg" }));
      const costText = svg("text", { x: 0, y: 1, class: "node-cost-text" });
      costText.textContent = "";
      costBadge.appendChild(costText);
      group.appendChild(costBadge);
      group.addEventListener("click", () => {
        if (activeNodeClickHandler) activeNodeClickHandler(id);
      });
      group.addEventListener("keydown", (event) => {
        if (!activeNodeClickHandler) return;
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        activeNodeClickHandler(id);
      });
      el.nodeLayer.appendChild(group);
    });
  }

  function getActivePart() {
    return parts[currentPartIndex];
  }

  function usesPart2Graph() {
    return getActivePart().graph === graphProfiles.part2;
  }

  function getActiveScenes() {
    return getActivePart().scenes;
  }

  function getInitialPartIndex() {
    const params = new URLSearchParams(window.location.search);
    const partParam = (params.get("part") || "").trim().toLowerCase();
    if (!partParam) return 0;

    const normalized = partParam.replace(/\s+/g, "");
    const index = parts.findIndex((part, partIndex) => {
      return part.id === normalized || part.label.toLowerCase().replace(/\s+/g, "") === normalized || String(partIndex + 1) === normalized;
    });

    return index >= 0 ? index : 0;
  }

  function getInitialSceneIndex(part) {
    const params = new URLSearchParams(window.location.search);
    const sceneParam = (params.get("scene") || "").trim().toLowerCase();
    if (!sceneParam) return 0;

    if (/^\d+$/.test(sceneParam)) {
      return clamp(Number(sceneParam) - 1, 0, part.scenes.length - 1);
    }

    const normalized = sceneParam.replace(/\s+/g, "");
    const index = part.scenes.findIndex((scene) => scene.tab.toLowerCase().replace(/\s+/g, "") === normalized);
    return index >= 0 ? index : 0;
  }

  function renderPartSwitcher() {
    el.partSwitcher.innerHTML = "";
    parts.forEach((part, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "part-tab";
      button.textContent = part.label;
      button.addEventListener("click", () => switchPartAnimated(index));
      el.partSwitcher.appendChild(button);
    });
  }

  function renderSceneTabs() {
    el.sceneTabs.innerHTML = "";
    getActiveScenes().forEach((scene, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "scene-tab";
      button.textContent = scene.tab;
      button.addEventListener("click", () => loadScene(index));
      el.sceneTabs.appendChild(button);
    });
  }

  function switchPart(index, initial = false, sceneOverride = null) {
    const nextIndex = Math.max(0, Math.min(parts.length - 1, index));
    if (!initial && nextIndex === currentPartIndex) return;
    currentPartIndex = nextIndex;
    currentScene = initial
      ? getInitialSceneIndex(getActivePart())
      : sceneOverride != null
        ? Math.max(0, Math.min(getActivePart().scenes.length - 1, sceneOverride))
        : getActivePart().lastScene || 0;
    applyPartGraph(getActivePart());
    renderSceneTabs();
    updatePartHeader();
    setActivePartTab();
    loadScene(currentScene);
  }

  // Chuyển phần có chuyển cảnh: fade vùng trình chiếu ra, đổi phần, fade vào.
  // Fade-in được tạo SAU switchPart vì resetVisualState() bên trong loadScene
  // gọi gsap.killTweensOf("*") — tween tạo trước thời điểm đó sẽ bị giết.
  function switchPartAnimated(index, sceneOverride = null) {
    if (partTransitionActive) return;
    const nextIndex = Math.max(0, Math.min(parts.length - 1, index));
    if (nextIndex === currentPartIndex) return;
    partTransitionActive = true;
    updateControlAvailability();

    // Nếu tween chuyển cảnh bị giết giữa chừng (vd. killTweensOf("*") của một
    // loadScene chen ngang), phải nhả cờ + trả lại opacity, không thì toàn bộ
    // điều hướng bị kẹt.
    const releaseTransition = () => {
      partTransitionActive = false;
      gsap.set(el.presenterGrid, { clearProps: "opacity,transform" });
      updateControlAvailability();
    };

    gsap.to(el.presenterGrid, {
      opacity: 0,
      y: 14,
      duration: dur(0.26),
      ease: "power2.in",
      onInterrupt: releaseTransition,
      onComplete: () => {
        switchPart(nextIndex, false, sceneOverride);
        gsap.fromTo(
          el.presenterGrid,
          { opacity: 0, y: -14 },
          {
            opacity: 1,
            y: 0,
            duration: dur(0.46),
            ease: "power3.out",
            clearProps: "opacity,transform",
            onInterrupt: releaseTransition,
            onComplete: () => {
              partTransitionActive = false;
              updateControlAvailability();
            },
          },
        );
      },
    });
  }

  function updatePartHeader() {
    const part = getActivePart();
    el.brandKicker.textContent = part.label;
    el.brandTitle.textContent = part.title;
    document.title = `${part.label} - ${part.title}`;
  }

  function setActivePartTab() {
    [...el.partSwitcher.children].forEach((tab, tabIndex) => {
      tab.classList.toggle("is-active", tabIndex === currentPartIndex);
    });
  }

  function bindControls() {
    el.prevButton.addEventListener("click", handlePrev);
    el.nextButton.addEventListener("click", handleNext);
    el.replayButton.addEventListener("click", () => loadScene(currentScene));
    el.pauseButton.addEventListener("click", togglePause);
    bindPart4Controls();

    document.addEventListener("keydown", (event) => {
      const tag = event.target && event.target.tagName;
      if (tag === "BUTTON") return;

      if (event.key === "ArrowRight" || event.key === " ") {
        event.preventDefault();
        handleNext();
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        handlePrev();
      }

      if (event.key.toLowerCase() === "r") {
        loadScene(currentScene);
      }

      if (event.key.toLowerCase() === "p") {
        togglePause();
      }
    });
  }

  function bindPart4Controls() {
    if (el.part4BackButton) el.part4BackButton.addEventListener("click", restorePreviousPart4ComplexityStep);
    if (el.part4ResetButton) el.part4ResetButton.addEventListener("click", restartPart4ComplexityScene);
    if (el.part4TreeButton) {
      el.part4TreeButton.addEventListener("click", () => {
        if (!part4ComplexityState || activeTimeline) return;
        part4ComplexityState.showTree = !part4ComplexityState.showTree;
        renderPart4Complexity();
      });
    }
  }

  function handleNext() {
    if (partTransitionActive) return;
    if (visualAdvanceBlocked) return;

    // Một timeline đang dừng giữa chừng: "Tiếp" nghĩa là chạy tiếp,
    // không phải nhảy sang scene khác.
    if (pendingTimelineResume && activeTimeline) {
      pendingTimelineResume = false;
      paused = false;
      activeTimeline.play();
      updatePauseButton();
      updateControlAvailability();
      return;
    }

    if (pendingVisualAdvance) {
      advancePendingVisual();
      return;
    }

    if (pendingCodeReveal) {
      revealPendingCode();
      return;
    }

    if (currentScene < getActiveScenes().length - 1) {
      loadScene(currentScene + 1);
      return;
    }

    // Hết scene của phần này: đi tiếp sang phần sau thay vì load lại scene
    // hiện tại (chính là lỗi spam mũi tên làm animation chạy lại từ đầu).
    if (currentPartIndex < parts.length - 1) {
      switchPartAnimated(currentPartIndex + 1, 0);
    }
  }

  function handlePrev() {
    if (partTransitionActive) return;

    if (currentScene > 0) {
      loadScene(currentScene - 1);
      return;
    }

    // Đang ở scene đầu: lùi về scene cuối của phần trước, không reload chính nó.
    if (currentPartIndex > 0) {
      switchPartAnimated(currentPartIndex - 1, parts[currentPartIndex - 1].scenes.length - 1);
    }
  }

  function loadScene(index) {
    const scenes = getActiveScenes();
    currentScene = Math.max(0, Math.min(scenes.length - 1, index));
    getActivePart().lastScene = currentScene;
    resetVisualState();
    setSceneCopy(scenes[currentScene]);
    setActiveTab(currentScene);
    setProgress(currentScene);

    activeTimeline = scenes[currentScene].enter();
    paused = false;
    updatePauseButton();
    updateControlAvailability();
  }

  function resetVisualState() {
    updateWorkspaceMode();
    if (activeTimeline) activeTimeline.kill();
    if (activeRouteTween) activeRouteTween.kill();
    if (ghostRouteTween) ghostRouteTween.kill();
    if (activeCodeRevealTween) activeCodeRevealTween.kill();
    gsap.killTweensOf("*");
    activeRouteTween = null;
    ghostRouteTween = null;
    activeCodeRevealTween = null;
    pendingCodeReveal = false;
    pendingCodePayload = null;
    activeNodeClickHandler = null;
    pendingVisualAdvance = null;
    pendingVisualLabel = null;
    pendingTimelineResume = false;
    visualAdvanceBlocked = false;
    hidePart4Views();
    clearLayer(el.routeCloud);
    clearLayer(el.activeRouteLayer);
    clearLayer(el.cutLayer);
    clearAnnotations();
    bestRouteElement = null;
    el.comparisonPanel.setAttribute("aria-hidden", "true");
    hidePruneLens();
    hideCodePanel();
    hideMemoryPanel();
    el.stageShell.classList.remove("is-visual-proof");
    el.metricStrip.classList.remove("is-hidden");
    hideWorkbench();
    setMetrics("-", "-", "-");
    renderRouteList([]);
    resetGraphClasses();
    resetCamera();
    gsap.set([".node-group", ".edge-group", ".edge-label-group"], { clearProps: "visibility" });
    gsap.set([el.baseEdges, el.edgeLabels, el.nodeLayer, el.mapTexture], { opacity: 1 });
    gsap.set(".node-group", { opacity: 1, scale: 1, transformOrigin: "center center" });
    gsap.set(".edge-group", { opacity: 1 });
    gsap.set(".edge-label-group", { opacity: 1 });
    gsap.set(".edge-line", { opacity: 1 });
  }

  function updateWorkspaceMode() {
    const isCodeWorkspace = getActivePart().id === "part3";
    const isPart4Workspace = getActivePart().id === "part4";
    el.presenterGrid.classList.toggle("is-code-workspace", isCodeWorkspace);
    el.presenterGrid.classList.toggle("is-part4-workspace", isPart4Workspace);
    el.stageShell.classList.toggle("is-code-workspace", isCodeWorkspace);
    el.stageShell.classList.toggle("is-part4-workspace", isPart4Workspace);
    if (el.part4Workspace) el.part4Workspace.setAttribute("aria-hidden", isPart4Workspace ? "false" : "true");
  }

  // Lời thoại có thể chứa {ROUTES} / {BENCH}; số liệu được điền lúc chạy để
  // copy không bao giờ lệch với graph thật.
  function formatSceneText(text) {
    if (typeof text !== "string") return text;
    return text.replaceAll("{ROUTES}", String(part1RouteTotal)).replaceAll("{BENCH}", String(part1BenchmarkCost));
  }

  function setSceneCopy(scene) {
    el.sceneKicker.textContent = formatSceneText(scene.kicker);
    el.sceneTitle.textContent = formatSceneText(scene.title);
    el.sceneBody.textContent = formatSceneText(scene.body);
    setMetricLabels(scene.metricLabels);
    el.audienceTitle.textContent = formatSceneText(scene.audienceTitle);
    el.audienceBullets.innerHTML = "";
    scene.audienceBullets.forEach((bullet) => {
      const li = document.createElement("li");
      li.textContent = formatSceneText(bullet);
      el.audienceBullets.appendChild(li);
    });
  }

  function setActiveTab(index) {
    [...el.sceneTabs.children].forEach((tab, tabIndex) => {
      tab.classList.toggle("is-active", tabIndex === index);
      if (tabIndex === index) {
        tab.scrollIntoView({ block: "nearest", inline: "nearest", behavior: prefersReducedMotion ? "auto" : "smooth" });
      }
    });
  }

  function setProgress(index) {
    const scenes = getActiveScenes();
    const progress = scenes.length === 1 ? 100 : (index / (scenes.length - 1)) * 100;
    el.progressFill.style.width = `${progress}%`;
  }

  function updateControlAvailability() {
    const scenes = getActiveScenes();
    const atLastScene = currentScene === scenes.length - 1;
    const hasNextPart = currentPartIndex < parts.length - 1;
    const hasPrevPart = currentPartIndex > 0;
    el.prevButton.disabled = partTransitionActive || (currentScene === 0 && !hasPrevPart);
    el.nextButton.disabled =
      partTransitionActive ||
      visualAdvanceBlocked ||
      (atLastScene && !hasNextPart && !pendingCodeReveal && !pendingVisualAdvance && !pendingTimelineResume);
    const isCodeEdit = pendingCodePayload && ((pendingCodePayload.changed || []).length > 0 || /sửa/.test(pendingCodePayload.status || ""));
    if (pendingTimelineResume) {
      el.nextButton.textContent = "Chạy tiếp";
    } else if (pendingVisualAdvance && pendingVisualLabel) {
      el.nextButton.textContent = pendingVisualLabel;
    } else if (pendingCodeReveal) {
      el.nextButton.textContent = isCodeEdit ? "Sửa code" : "Viết code";
    } else if (atLastScene && hasNextPart) {
      el.nextButton.textContent = `Sang ${parts[currentPartIndex + 1].label}`;
    } else {
      el.nextButton.textContent = "Tiếp";
    }
    // Khi "Tiếp" đang là hành động trong scene (không phải chuyển scene),
    // đổi diện mạo nút để người trình bày không bấm nhầm nhịp.
    el.nextButton.classList.toggle("is-step-mode", Boolean(pendingTimelineResume || pendingVisualAdvance || pendingCodeReveal));
    el.pauseButton.disabled = !activeTimeline;
  }

  function showWorkbench(kicker, title, status, showCompare) {
    el.workbench.setAttribute("aria-hidden", "false");
    el.workbenchKicker.textContent = kicker;
    el.workbenchTitle.textContent = title;
    el.workbenchStatus.textContent = status;
    el.workloadProgressFill.style.width = "0%";
    el.workloadProgressFill.style.background = showCompare ? "var(--accent)" : "var(--amber)";
    el.workloadCompare.setAttribute("aria-hidden", showCompare ? "false" : "true");
    if (!showCompare) {
      updateCompareBars(0, 0, 1, 1);
    }
  }

  function hideWorkbench() {
    el.workbench.setAttribute("aria-hidden", "true");
    el.workbench.classList.remove("is-quiz", "is-action", "is-manual-steps");
    el.workloadGrid.innerHTML = "";
    el.workloadProgressFill.style.width = "0%";
    el.workloadCompare.setAttribute("aria-hidden", "true");
  }

  function renderWorkloadGrid(routes) {
    el.workloadGrid.innerHTML = "";
    routes.forEach((route, index) => {
      const cell = document.createElement("span");
      cell.className = "workload-cell";
      cell.title = `${index + 1}. ${formatRoute(route.path)} = ${route.cost}`;
      cell.dataset.index = String(index);
      el.workloadGrid.appendChild(cell);
    });
  }

  function updateWorkloadCell(index, state) {
    const cell = el.workloadGrid.children[index];
    if (!cell) return;
    cell.classList.remove("is-current", "is-done", "is-best", "is-pruned", "is-skipped");
    if (state) cell.classList.add(`is-${state}`);
  }

  function setWorkbenchStatus(status) {
    el.workbenchStatus.textContent = status;
  }

  function setWorkbenchProgress(value, total, mode) {
    const pct = total ? Math.max(0, Math.min(100, (value / total) * 100)) : 0;
    el.workloadProgressFill.style.width = `${pct}%`;
    if (mode === "done") el.workloadProgressFill.style.background = "var(--accent)";
    if (mode === "prune") el.workloadProgressFill.style.background = "var(--accent)";
    if (mode === "brute") el.workloadProgressFill.style.background = "var(--amber)";
  }

  function updateCompareBars(bruteSegments, prunedSegments, bruteMax, prunedTarget) {
    const max = Math.max(1, bruteMax);
    el.bruteBar.style.width = `${Math.min(100, (bruteSegments / max) * 100)}%`;
    el.prunedBar.style.width = `${Math.min(100, (prunedSegments / max) * 100)}%`;
    el.bruteSegmentsLabel.textContent = `${bruteSegments} đoạn`;
    el.prunedSegmentsLabel.textContent =
      prunedSegments >= prunedTarget ? `${prunedSegments} đoạn` : `${prunedSegments || 0}/${prunedTarget} đoạn`;
  }

  function showPruneLens() {
    el.pruneLens.setAttribute("aria-hidden", "false");
  }

  function hidePruneLens() {
    el.pruneLens.setAttribute("aria-hidden", "true");
  }

  function showCodePanel({ title, status, lines, active = [], soft = [], inserted = [], changed = [], dim = [], note, compact = false }) {
    const activeSet = new Set(active);
    const softSet = new Set(soft);
    const insertedSet = new Set(inserted);
    const changedSet = new Set(changed);
    const dimSet = new Set(dim);
    el.stageShell.classList.add("is-code-mode");
    el.codePanel.setAttribute("aria-hidden", "false");
    el.codePanel.classList.toggle("is-compact", compact);
    el.codePanelTitle.textContent = title;
    el.codePanelStatus.textContent = status;
    el.codeNote.textContent = note || "";
    el.codeBlock.innerHTML = "";

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const row = document.createElement("span");
      row.className = "code-line";
      row.dataset.line = String(lineNumber);
      row.classList.toggle("is-active", activeSet.has(lineNumber));
      row.classList.toggle("is-soft", softSet.has(lineNumber));
      row.classList.toggle("is-new", insertedSet.has(lineNumber));
      row.classList.toggle("is-change", changedSet.has(lineNumber));
      row.classList.toggle("is-dim", dimSet.has(lineNumber));

      const gutter = document.createElement("span");
      gutter.textContent = String(lineNumber).padStart(2, "0");

      const code = document.createElement("code");
      code.textContent = line || " ";

      row.appendChild(gutter);
      row.appendChild(code);
      el.codeBlock.appendChild(row);
    });

    if (!lines.length) {
      const row = document.createElement("span");
      row.className = "code-line is-placeholder";
      const gutter = document.createElement("span");
      gutter.textContent = "--";
      const code = document.createElement("code");
      code.textContent = '// tờ giấy trắng — bấm "Viết code" để bắt đầu';
      row.appendChild(gutter);
      row.appendChild(code);
      el.codeBlock.appendChild(row);
    }
  }

  function focusCodeLines(lineNumbers, context = 3) {
    const targetLines = lineNumbers.filter(Boolean).sort((a, b) => a - b);
    if (!targetLines.length) return;

    const firstEditLine = targetLines[0];
    const lastEditLine = targetLines[targetLines.length - 1];
    const targetLine = lastEditLine - firstEditLine > 8 ? lastEditLine : firstEditLine;
    const firstLine = Math.max(1, targetLine - context);
    const target =
      el.codeBlock.querySelector(`[data-line="${firstLine}"]`) ||
      el.codeBlock.querySelector(`[data-line="${targetLine}"]`);
    if (!target) return;

    const blockRect = el.codeBlock.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    el.codeBlock.scrollTop += targetRect.top - blockRect.top - 12;
  }

  function setCodeActiveLines(lineNumbers) {
    const activeSet = new Set(lineNumbers.filter(Boolean));
    document.querySelectorAll(".code-line").forEach((line) => {
      line.classList.toggle("is-active", activeSet.has(Number(line.dataset.line)));
    });
  }

  function hideCodePanel() {
    el.stageShell.classList.remove("is-code-mode");
    el.codePanel.setAttribute("aria-hidden", "true");
    el.codePanel.classList.remove("is-compact");
    el.codeBlock.innerHTML = "";
    el.codeNote.textContent = "";
  }

  function showMemoryPanel({ cost = {}, visited = [], prev = {}, focus = [], amber = [], danger = [] } = {}) {
    const focusSet = new Set(focus);
    const amberSet = new Set(amber);
    const dangerSet = new Set(danger);
    el.memoryPanel.setAttribute("aria-hidden", "false");
    renderMemoryChips(el.costMemory, Object.entries(cost).map(([node, value]) => `${node}:${value}`), focusSet, amberSet, dangerSet);
    renderMemoryChips(el.visitedMemory, visited, focusSet, amberSet, dangerSet);
    renderMemoryChips(el.prevMemory, Object.entries(prev).map(([node, value]) => `${node}<-${value}`), focusSet, amberSet, dangerSet);
  }

  function renderMemoryChips(container, items, focusSet, amberSet, dangerSet) {
    container.innerHTML = "";
    if (!items.length) {
      const chip = document.createElement("span");
      chip.className = "memory-chip is-muted";
      chip.textContent = "-";
      container.appendChild(chip);
      return;
    }

    items.forEach((item) => {
      const key = String(item).split(/[:<-]/)[0];
      const chip = document.createElement("span");
      chip.className = "memory-chip";
      chip.classList.toggle("is-focus", focusSet.has(key) || focusSet.has(item));
      chip.classList.toggle("is-amber", amberSet.has(key) || amberSet.has(item));
      chip.classList.toggle("is-danger", dangerSet.has(key) || dangerSet.has(item));
      chip.textContent = item;
      container.appendChild(chip);
    });
  }

  function hideMemoryPanel() {
    el.memoryPanel.setAttribute("aria-hidden", "true");
    el.costMemory.innerHTML = "";
    el.visitedMemory.innerHTML = "";
    el.prevMemory.innerHTML = "";
  }

  function animateMemoryPanel(tl, at = 0.1) {
    tl.fromTo(el.memoryPanel, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: dur(0.4), ease: "power3.out" }, at);
    if (document.querySelector(".memory-chip.is-focus, .memory-chip.is-amber")) {
      tl.fromTo(".memory-chip.is-focus, .memory-chip.is-amber", { scale: 0.82, opacity: 0 }, { scale: 1, opacity: 1, stagger: dur(0.035), duration: dur(0.28), ease: "back.out(1.5)" }, at + 0.15);
    }
  }

  function getPreviousPart3CodeState(step) {
    const currentIndex = part3CodeBuildOrder.indexOf(step);
    if (currentIndex <= 0) return null;
    return part3CodeStates[part3CodeBuildOrder[currentIndex - 1]] || null;
  }

  function prepareCodeReveal(payload) {
    pendingCodePayload = payload || null;
    pendingCodeReveal = Boolean(pendingCodePayload);
    updateControlAvailability();
  }

  function prepareVisualAdvance(handler, label = null) {
    pendingVisualAdvance = typeof handler === "function" ? handler : null;
    pendingVisualLabel = pendingVisualAdvance ? label : null;
    visualAdvanceBlocked = false;
    updateControlAvailability();
  }

  function advancePendingVisual() {
    const handler = pendingVisualAdvance;
    if (!handler) return;
    if (activeTimeline) {
      const timeline = activeTimeline;
      timeline.progress(1);
      timeline.kill();
      activeTimeline = null;
    }
    pendingVisualAdvance = null;
    pendingVisualLabel = null;
    handler();
    updatePauseButton();
    updateControlAvailability();
  }

  function collapseCodeEditLines(editLines) {
    if (!editLines.length) {
      updateControlAvailability();
      return;
    }

    editLines.forEach((line) => {
      const style = window.getComputedStyle(line);
      line.dataset.revealHeight = `${line.getBoundingClientRect().height}px`;
      line.dataset.revealPaddingTop = style.paddingTop;
      line.dataset.revealPaddingBottom = style.paddingBottom;
    });

    gsap.set(editLines, {
      height: 0,
      opacity: 0,
      overflow: "hidden",
      paddingTop: 0,
      paddingBottom: 0,
      y: -8,
      scaleY: 0.96,
      transformOrigin: "top center",
    });
  }

  function revealPendingCode() {
    if (!pendingCodeReveal) return;
    const payload = pendingCodePayload;
    if (activeTimeline) {
      const timeline = activeTimeline;
      timeline.progress(1);
      timeline.kill();
      activeTimeline = null;
    }

    pendingCodeReveal = false;
    pendingCodePayload = null;
    showCodePanel({
      title: payload.title,
      status: payload.status,
      lines: payload.lines,
      active: payload.active,
      inserted: payload.inserted,
      changed: payload.changed,
      dim: payload.dim,
      note: "",
      compact: payload.compact,
    });
    focusCodeLines([...payload.inserted, ...payload.changed]);

    const editLines = [...document.querySelectorAll(".code-line.is-new, .code-line.is-change")];
    collapseCodeEditLines(editLines);
    el.codePanelStatus.textContent = el.codePanelStatus.textContent.includes("sửa") ? "đã sửa" : "đã viết";
    activeCodeRevealTween = gsap.timeline({
      defaults: { ease: "power2.out" },
      onComplete: () => {
        focusCodeLines([...payload.inserted, ...payload.changed]);
        gsap.set(editLines, { clearProps: "height,overflow,paddingTop,paddingBottom,y,scaleY,transformOrigin,opacity" });
        editLines.forEach((line) => {
          delete line.dataset.revealHeight;
          delete line.dataset.revealPaddingTop;
          delete line.dataset.revealPaddingBottom;
        });
        activeCodeRevealTween = null;
        activeTimeline = null;
        updatePauseButton();
        updateControlAvailability();
      },
    });
    activeTimeline = activeCodeRevealTween;
    activeCodeRevealTween.to(editLines, {
      height: (index, line) => line.dataset.revealHeight || "auto",
      paddingTop: (index, line) => line.dataset.revealPaddingTop || "",
      paddingBottom: (index, line) => line.dataset.revealPaddingBottom || "",
      opacity: 1,
      y: 0,
      scaleY: 1,
      stagger: dur(0.06),
      duration: dur(0.38),
      ease: "back.out(1.25)",
    });
    updatePauseButton();
    updateControlAvailability();
  }

  function showPart3Code(step, title, status, options = {}) {
    const codeState = part3CodeStates[step];
    const inserted = options.inserted || codeState.inserted || [];
    const changed = options.changed || codeState.changed || [];
    const hasEdit = inserted.length > 0 || changed.length > 0;
    const previousCodeState = hasEdit ? getPreviousPart3CodeState(step) : null;
    showCodePanel({
      title,
      status,
      lines: previousCodeState ? previousCodeState.lines : hasEdit ? [] : codeState.lines,
      active: hasEdit ? [] : options.active || codeState.active || [],
      inserted: [],
      changed: [],
      dim: hasEdit ? [] : options.dim || codeState.dim || [],
      note: "",
      compact: options.compact || codeState.compact || false,
    });
    if (hasEdit && previousCodeState) focusCodeLines([...inserted, ...changed]);
    prepareCodeReveal(
      hasEdit
        ? {
            title,
            status,
            lines: codeState.lines,
            active: options.active || codeState.active || [],
            inserted,
            changed,
            dim: options.dim || codeState.dim || [],
            compact: options.compact || codeState.compact || false,
          }
        : null,
    );
  }

  function updatePruneLens(info, bestCost) {
    const state = info.pruned ? "cut" : "walk";
    const remaining = info.remaining && info.remaining.length > 1 ? info.remaining : [info.path[info.path.length - 1]];

    el.pruneLens.dataset.state = state;
    el.pruneDecision.textContent = info.pruned ? `Cắt tại ${info.cutNode}` : "Tiếp tục";
    el.pruneCurrentCost.textContent = info.cost;
    el.pruneOperator.textContent = info.pruned ? ">" : "<=";
    el.pruneBestCost.textContent = bestCost;
    el.prunePrefix.textContent = formatRoute(info.path);
    el.pruneRemaining.textContent = info.pruned ? formatRoute(remaining) : "chưa bỏ qua";
    el.pruneReason.textContent = info.pruned
      ? `Đã vượt ${bestCost}. Vì các đoạn sau đều tăng chi phí, phần còn lại không thể thắng.`
      : `Chưa vượt ${bestCost}, tuyến này vẫn còn khả năng cạnh tranh.`;
  }

  function updatePruneLensNewBest(route, oldBestCost, newBestCost) {
    el.pruneLens.dataset.state = "walk";
    el.pruneDecision.textContent = `Mốc mới ${newBestCost}`;
    el.pruneCurrentCost.textContent = newBestCost;
    el.pruneOperator.textContent = "<";
    el.pruneBestCost.textContent = oldBestCost;
    el.prunePrefix.textContent = formatRoute(route.path);
    el.pruneRemaining.textContent = "thay mốc";
    el.pruneReason.textContent = `Tuyến này tốt hơn mốc ${oldBestCost}, nên nó trở thành mốc hiện tại mới.`;
  }

  function renderRouteWindow(routes, currentIndex, bestIndex, extra = {}) {
    const size = 6;
    const start = Math.max(0, Math.min(Math.max(0, currentIndex - 2), Math.max(0, routes.length - size)));
    const items = routes.slice(start, start + size);
    const localCurrent = currentIndex >= start && currentIndex < start + size ? currentIndex - start : -1;
    const localBest = bestIndex >= start && bestIndex < start + size ? bestIndex - start : -1;
    renderRouteList(items, {
      currentIndex: extra.pruned ? -1 : localCurrent,
      bestIndex: localBest,
      prunedIndex: extra.pruned ? localCurrent : -1,
    });
    if (extra.prunedCount != null) {
      el.routeCountLabel.textContent = `${extra.prunedCount} dừng sớm`;
    } else {
      el.routeCountLabel.textContent = `${Math.min(currentIndex + 1, routes.length)}/${routes.length} tuyến`;
    }
  }

  function renderPruneRouteWindow(routes, currentIndex, benchmark, extra = {}) {
    const size = 5;
    const start = Math.max(0, Math.min(Math.max(0, currentIndex - 2), Math.max(0, routes.length - size)));
    const items = [
      { label: `Mốc hiện tại: ${formatRoute(benchmark.path)}`, cost: benchmark.cost, status: "best" },
      ...routes.slice(start, start + size),
    ];
    const localCurrent = currentIndex >= start && currentIndex < start + size ? currentIndex - start + 1 : -1;
    renderRouteList(items, {
      currentIndex: extra.pruned ? -1 : localCurrent,
      bestIndex: 0,
      prunedIndex: extra.pruned ? localCurrent : -1,
    });
    if (extra.prunedCount != null) {
      el.routeCountLabel.textContent = `${extra.prunedCount} dừng sớm`;
    } else {
      el.routeCountLabel.textContent = `${Math.min(currentIndex + 1, routes.length)}/${routes.length} tuyến`;
    }
  }

  function makePart2State(entries) {
    const rows = {};
    part2NodeOrder.forEach((node) => {
      const [status, cost, prev] = entries[node] || ["unknown", null, "-"];
      rows[node] = { node, status, cost, prev };
    });
    return rows;
  }

  function resetGraphClasses() {
    document.querySelectorAll(".node-group").forEach((node) => {
      node.classList.remove("is-muted", "is-open", "is-settled", "is-focus", "is-wrong", "is-correct", "is-clickable", "is-target", "is-context", "has-node-cost");
    });
    document.querySelectorAll(".edge-group").forEach((edge) => {
      edge.classList.remove("is-hidden-edge", "is-revealed", "is-focus", "is-locked", "is-context");
    });
    document.querySelectorAll(".edge-label-group").forEach((label) => {
      label.classList.remove("is-hidden-edge", "is-revealed", "is-focus", "is-locked", "is-context");
    });
  }

  function toEdgeKeys(groups) {
    const keys = [];

    function add(item) {
      if (!item) return;
      if (typeof item === "string") {
        keys.push(item);
        return;
      }
      if (Array.isArray(item) && item.length === 2 && typeof item[0] === "string" && typeof item[1] === "string") {
        keys.push(edgeKey(item[0], item[1]));
        return;
      }
      if (Array.isArray(item)) item.forEach(add);
    }

    add(groups);
    return keys;
  }

  function routeToEdges(route) {
    const result = [];
    for (let index = 0; index < route.length - 1; index += 1) {
      result.push([route[index], route[index + 1]]);
    }
    return result;
  }

  function setEdgeStates({ visible = [], focus = [], locked = [], context = [] } = {}) {
    const visibleSet = new Set(toEdgeKeys(visible));
    const focusSet = new Set(toEdgeKeys(focus));
    const lockedSet = new Set(toEdgeKeys(locked));
    const contextSet = new Set(toEdgeKeys(context));
    document.querySelectorAll(".edge-group").forEach((edge) => {
      const key = edge.dataset.edge;
      edge.classList.remove("is-hidden-edge", "is-revealed", "is-focus", "is-locked", "is-context");
      if (!usesPart2Graph()) return;

      const isVisible = visibleSet.has(key) || focusSet.has(key) || lockedSet.has(key) || contextSet.has(key);
      edge.classList.toggle("is-hidden-edge", !isVisible);
      edge.classList.toggle("is-revealed", isVisible);
      edge.classList.toggle("is-focus", focusSet.has(key));
      edge.classList.toggle("is-locked", lockedSet.has(key));
      edge.classList.toggle("is-context", contextSet.has(key));
    });
    document.querySelectorAll(".edge-label-group").forEach((label) => {
      const key = label.dataset.edge;
      label.classList.remove("is-hidden-edge", "is-revealed", "is-focus", "is-locked", "is-context");
      if (!usesPart2Graph()) return;

      const isVisible = visibleSet.has(key) || focusSet.has(key) || lockedSet.has(key) || contextSet.has(key);
      label.classList.toggle("is-hidden-edge", !isVisible);
      label.classList.toggle("is-revealed", isVisible);
      label.classList.toggle("is-focus", focusSet.has(key));
      label.classList.toggle("is-locked", lockedSet.has(key));
      label.classList.toggle("is-context", contextSet.has(key));
    });
  }

  function setNodeStates(state, options = {}) {
    const focus = new Set(options.focus || []);
    const wrong = new Set(options.wrong || []);
    const correct = new Set(options.correct || []);
    const clickable = new Set(options.clickable || []);
    const target = new Set(options.target || []);
    const context = new Set(options.context || []);
    const showNodeCosts = options.showNodeCosts === true;
    const nodeCostFilter = new Set(options.nodeCostNodes || []);

    document.querySelectorAll(".node-group").forEach((nodeEl) => {
      const id = nodeEl.dataset.node;
      const row = state && state[id];
      nodeEl.classList.remove("is-muted", "is-open", "is-settled", "is-focus", "is-wrong", "is-correct", "is-clickable", "is-target", "is-context", "has-node-cost");
      if (row) {
        nodeEl.classList.add(`is-${row.status}`);
        if (row.status === "unknown" && !focus.has(id) && !wrong.has(id) && !correct.has(id) && !clickable.has(id) && !context.has(id) && !target.has(id)) {
          nodeEl.classList.add("is-muted");
        }
      } else if (usesPart2Graph() && !context.has(id) && !target.has(id)) {
        nodeEl.classList.add("is-muted");
      }
      if (focus.has(id)) nodeEl.classList.add("is-focus");
      if (wrong.has(id)) nodeEl.classList.add("is-wrong");
      if (correct.has(id)) nodeEl.classList.add("is-correct");
      if (target.has(id)) nodeEl.classList.add("is-target");
      if (context.has(id)) nodeEl.classList.add("is-context");
      if (clickable.has(id)) nodeEl.classList.add("is-clickable");
      if (clickable.has(id)) {
        nodeEl.setAttribute("tabindex", "0");
        nodeEl.setAttribute("role", "button");
        nodeEl.setAttribute("aria-label", `Chọn đỉnh ${id}`);
      } else {
        nodeEl.removeAttribute("tabindex");
        nodeEl.removeAttribute("role");
        nodeEl.removeAttribute("aria-label");
      }

      const costText = nodeEl.querySelector(".node-cost-text");
      const canShowCost =
        showNodeCosts &&
        row &&
        row.cost != null &&
        row.status !== "unknown" &&
        (!nodeCostFilter.size || nodeCostFilter.has(id));
      if (costText) costText.textContent = canShowCost ? String(row.cost) : "";
      nodeEl.classList.toggle("has-node-cost", canShowCost);
    });
  }

  function renderDijkstraTable(state, options = {}) {
    const focus = new Set(options.focus || []);
    const showCosts = options.showCosts !== false;
    const showPrev = options.showPrev === true;
    const showUnknown = options.showUnknown === true;
    const statusText = {
      unknown: "Chưa biết",
      open: "Đang mở",
      settled: "Đã chốt",
    };

    el.routeList.innerHTML = "";
    el.routeList.classList.add("is-state-table");
    el.routeCountLabel.textContent = showPrev ? "Cost / Prev" : showCosts ? "Cost / Trạng thái" : "Trạng thái";

    part2NodeOrder.forEach((node) => {
      const row = state[node];
      if (!showUnknown && row.status === "unknown" && !focus.has(node)) return;
      const div = document.createElement("div");
      div.className = `state-row is-${row.status}${showPrev ? " has-prev" : " no-prev"}${showCosts ? "" : " no-cost"}${focus.has(node) ? " is-focus" : ""}`;
      div.dataset.node = node;

      const label = document.createElement("strong");
      label.textContent = node;
      const cost = document.createElement("span");
      cost.className = "state-cost";
      cost.textContent = row.cost == null ? "?" : showCosts || row.status === "settled" ? String(row.cost) : "?";
      const status = document.createElement("span");
      status.textContent = showPrev ? (row.prev && row.prev !== "-" ? "từ" : "gốc") : statusText[row.status];
      const prev = document.createElement("em");
      prev.textContent = row.prev || "-";

      div.appendChild(label);
      div.appendChild(cost);
      div.appendChild(status);
      div.appendChild(prev);
      el.routeList.appendChild(div);
    });
  }

  function showPart2Workbench(kicker, title, status, mode) {
    showWorkbench(kicker, title, status, false);
    el.workbench.classList.remove("is-quiz", "is-action", "is-manual-steps");
    el.workbench.classList.add(mode);
    el.workloadGrid.innerHTML = "";
  }

  function setupCandidateQuiz({ candidates, answer, title, status, candidateMeta = {}, onCorrect, onWrong, advanceLabel = "Chốt đỉnh" }) {
    let completed = false;
    showPart2Workbench("Quiz", title, status, "is-quiz");

    candidates.forEach((node) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "candidate-button";
      button.dataset.node = node;

      const primary = document.createElement("strong");
      primary.textContent = node;
      button.appendChild(primary);

      if (candidateMeta[node]) {
        const secondary = document.createElement("span");
        secondary.textContent = candidateMeta[node];
        button.appendChild(secondary);
      }

      button.addEventListener("click", () => choose(node));
      el.workloadGrid.appendChild(button);
    });

    activeNodeClickHandler = (node) => {
      if (candidates.includes(node)) choose(node);
    };

    // "Tiếp" không được nhảy qua bước chọn: chừng nào quiz chưa xong, nút Tiếp
    // đóng vai trò thực hiện lựa chọn đúng (vẫn có thể bấm tay vào đỉnh/nút).
    prepareVisualAdvance(() => choose(answer), advanceLabel);

    function choose(node) {
      if (completed) return;
      const button = el.workloadGrid.querySelector(`[data-node="${node}"]`);
      if (node === answer) {
        completed = true;
        activeNodeClickHandler = null;
        prepareVisualAdvance(null);
        [...el.workloadGrid.children].forEach((child) => {
          child.disabled = true;
          child.classList.toggle("is-correct", child.dataset.node === node);
        });
        onCorrect(node);
        return;
      }

      if (button) button.classList.add("is-wrong");
      onWrong(node);
    }
  }

  function setupActionButton(label, onClick, options = {}) {
    showPart2Workbench(
      options.kicker || "Hành động",
      options.title || "Ẩn cost để nhấn mạnh quy tắc",
      options.status || "chờ",
      "is-action",
    );
    const button = document.createElement("button");
    button.type = "button";
    button.className = "action-button";
    button.textContent = label;
    const activate = () => {
      if (button.disabled) return;
      button.disabled = true;
      onClick();
    };
    button.addEventListener("click", () => {
      prepareVisualAdvance(null);
      activate();
    });
    el.workloadGrid.appendChild(button);
    // Nút Tiếp cũng kích hoạt được hành động này thay vì bỏ qua scene.
    prepareVisualAdvance(activate, options.advanceLabel || label);
  }

  function drawGhostRoute(route, options = {}) {
    if (ghostRouteTween) {
      ghostRouteTween.kill();
      ghostRouteTween = null;
    }
    clearLayer(el.cutLayer);
    const dataRoute = options.label || (Array.isArray(route) ? route.join("-") : "ghost");
    const pathData = options.pathData || (typeof route === "string" ? route : routePath(route, options.offset || 0));
    const group = svg("g", {
      class: "route-ghost-group",
      "data-route": dataRoute,
    });
    const path = svg("path", {
      d: pathData,
      class: "route-path route-ghost",
      "data-route": dataRoute,
    });
    group.appendChild(path);
    el.activeRouteLayer.appendChild(group);
    const length = path.getTotalLength();
    let labelGroup = null;
    if (options.costLabel) {
      const labelPoint = path.getPointAtLength(length * (options.labelT || 0.55));
      const labelText = String(options.costLabel);
      const labelWidth = Math.max(30, labelText.length * 10 + 18);
      labelGroup = svg("g", {
        class: "route-ghost-label-group",
        transform: `translate(${labelPoint.x + (options.labelDx || 0)} ${labelPoint.y + (options.labelDy || 0)})`,
      });
      labelGroup.appendChild(svg("rect", { x: -labelWidth / 2, y: -12, width: labelWidth, height: 24, rx: 7, class: "route-ghost-label-bg" }));
      const label = svg("text", { x: 0, y: 1, class: "route-ghost-label" });
      label.textContent = labelText;
      labelGroup.appendChild(label);
      group.appendChild(labelGroup);
    }
    ghostRouteTween = gsap.timeline({
      onComplete: () => {
        if (!options.persist && group.parentNode === el.cutLayer) group.remove();
        ghostRouteTween = null;
        if (typeof options.onComplete === "function") options.onComplete();
      },
    });
    ghostRouteTween.fromTo(
      path,
      { opacity: 0.2, strokeDasharray: length, strokeDashoffset: length },
      { opacity: 0.88, strokeDashoffset: 0, duration: dur(0.36), ease: "power2.out" },
    );
    if (labelGroup) {
      ghostRouteTween.fromTo(
        labelGroup,
        { opacity: 0, scale: 0.86, transformOrigin: "center center" },
        { opacity: 1, scale: 1, duration: dur(0.22), ease: "back.out(1.6)" },
        "<0.12",
      );
    }
    if (!options.persist) {
      ghostRouteTween.to(group, { opacity: 0, duration: dur(0.34), ease: "power2.in" }, "+=2.35");
    }
    return path;
  }

  function drawCandidateRoutes(routes) {
    routes.forEach((route) => {
      const path = drawRoute(route, "route-path route-candidate", el.activeRouteLayer);
      gsap.set(path, { opacity: 0.52 });
    });
  }

  function drawDependencyRoutes(routes) {
    const paths = [];
    routes.forEach((route, index) => {
      const offset = ((index % 3) - 1) * 7;
      const path = drawRoute(route, "route-path route-dependency", el.activeRouteLayer, offset);
      gsap.set(path, { opacity: index < 2 ? 0.74 : 0.52 });
      paths.push(path);
    });
    return paths;
  }

  function clearAnnotations() {
    if (el.annotationLayer) clearLayer(el.annotationLayer);
  }

  function drawCandidateBadges(state, candidates, options = {}) {
    const width = options.width || 144;
    const height = options.height || 60;
    const showCosts = options.showCosts !== false;
    const offsets = {
      C: { x: 40, y: 18 },
      B: { x: -154, y: -42 },
      D: { x: 40, y: -56 },
      E: { x: 42, y: -28 },
      F: { x: 40, y: -52 },
      G: { x: 40, y: -52 },
      K: { x: -168, y: -40 },
      ...(options.offsets || {}),
    };
    const toneMap = options.toneMap || {};
    const labels = options.labels || {};
    const group = svg("g", { class: "candidate-badges" });

    candidates.forEach((node) => {
      const point = nodes[node];
      const row = state[node] || {};
      if (!point) return;

      const offset = offsets[node] || { x: 38, y: -40 };
      const x = clamp(point.x + offset.x, 28, 1000 - width - 28);
      const y = clamp(point.y + offset.y, 46, 640 - height - 28);
      const leaderX = x < point.x ? x + width : x;
      const leaderY = y + height / 2;
      const tone = toneMap[node] || row.status || "open";
      const costText = row.cost == null ? "?" : String(row.cost);
      const title = showCosts ? `${node} = ${costText}` : node;
      const subtitle = labels[node] || (showCosts ? "cost hiện tại" : "đang mở, chưa bật cost");

      group.appendChild(
        svg("line", {
          x1: point.x,
          y1: point.y,
          x2: leaderX,
          y2: leaderY,
          class: `candidate-leader is-${tone}`,
          "data-candidate": node,
        }),
      );

      const badge = svg("g", {
        class: `candidate-badge is-${tone}${showCosts ? "" : " is-hidden-cost"}`,
        transform: `translate(${x} ${y})`,
        "data-candidate": node,
      });
      badge.appendChild(svg("rect", { x: 0, y: 0, width, height, rx: 8, class: "candidate-badge-bg" }));

      const titleEl = svg("text", { x: 14, y: 25, class: "candidate-badge-title" });
      titleEl.textContent = title;
      badge.appendChild(titleEl);

      const subtitleEl = svg("text", { x: 14, y: 46, class: "candidate-badge-subtitle" });
      subtitleEl.textContent = subtitle;
      badge.appendChild(subtitleEl);

      group.appendChild(badge);
    });

    el.annotationLayer.appendChild(group);
    return group;
  }

  function drawReverseDependencyRibbon(x, y) {
    const width = 466;
    const height = 168;
    const group = svg("g", { class: "dependency-ribbon", transform: `translate(${x} ${y})` });
    group.appendChild(svg("rect", { x: 0, y: 0, width, height, rx: 8, class: "dependency-ribbon-bg" }));

    const title = svg("text", { x: 18, y: 28, class: "dependency-ribbon-title" });
    title.textContent = "Câu hỏi lan ngược";
    group.appendChild(title);

    const cards = [
      { label: "K", sub: "đích", x: 18, y: 48, w: 76 },
      { label: "F/G", sub: "cửa vào K", x: 126, y: 48, w: 88 },
      { label: "D/E", sub: "trước F/G", x: 246, y: 48, w: 88 },
      { label: "A/B/C", sub: "gần gốc", x: 366, y: 48, w: 82 },
    ];

    cards.forEach((card, index) => {
      if (index > 0) {
        group.appendChild(
          svg("line", {
            x1: cards[index - 1].x + cards[index - 1].w + 6,
            y1: card.y + 24,
            x2: card.x - 8,
            y2: card.y + 24,
            class: "dependency-ribbon-link",
          }),
        );
      }

      const cardGroup = svg("g", { transform: `translate(${card.x} ${card.y})` });
      cardGroup.appendChild(svg("rect", { x: 0, y: 0, width: card.w, height: 48, rx: 8, class: "dependency-ribbon-card" }));
      const label = svg("text", { x: 12, y: 20, class: "dependency-ribbon-node" });
      label.textContent = card.label;
      const sub = svg("text", { x: 12, y: 37, class: "dependency-ribbon-sub" });
      sub.textContent = card.sub;
      cardGroup.appendChild(label);
      cardGroup.appendChild(sub);
      group.appendChild(cardGroup);
    });

    const formulas = [
      "K = min(tốt F + 4, tốt G + 2)",
      "F và G lại hỏi tiếp về D/E; D/E lại hỏi về A/B/C.",
      "Cứ thế, câu hỏi bị kéo ngược về phía A.",
    ];

    formulas.forEach((line, index) => {
      const text = svg("text", { x: 18, y: 116 + index * 20, class: index === 0 ? "dependency-ribbon-formula" : "dependency-ribbon-note" });
      text.textContent = line;
      group.appendChild(text);
    });

    el.annotationLayer.appendChild(group);
    return group;
  }

  function drawProblemShiftVisual() {
    const group = svg("g", { class: "problem-shift-visual" });

    const card = svg("g", { class: "problem-overview-card", transform: "translate(438 92)" });
    card.appendChild(svg("rect", { x: 0, y: 0, width: 444, height: 108, rx: 8, class: "problem-overview-bg" }));
    const eyebrow = svg("text", { x: 18, y: 24, class: "problem-overview-eyebrow" });
    eyebrow.textContent = "Bài toán mới";
    const title = svg("text", { x: 18, y: 56, class: "problem-overview-title" });
    title.textContent = "đường ngắn nhất từ A tới mọi đỉnh";
    const note = svg("text", { x: 18, y: 84, class: "problem-overview-note" });
    note.textContent = "A = 0; các đỉnh còn lại là câu hỏi cần giải.";
    card.appendChild(eyebrow);
    card.appendChild(title);
    card.appendChild(note);
    group.appendChild(card);

    const slots = [
      { node: "A", value: "0", sub: "đã biết", x: 136, y: 282, tone: "root" },
      { node: "C", value: "?", sub: "cần tìm", x: 318, y: 248 },
      { node: "B", value: "?", sub: "cần tìm", x: 184, y: 458 },
      { node: "D", value: "?", sub: "cần tìm", x: 322, y: 534 },
      { node: "E", value: "?", sub: "cần tìm", x: 480, y: 388 },
      { node: "F", value: "?", sub: "cần tìm", x: 674, y: 220 },
      { node: "G", value: "?", sub: "cần tìm", x: 690, y: 526 },
      { node: "K", value: "?", sub: "đích cuối", x: 744, y: 410, tone: "target" },
    ];

    slots.forEach((slot) => {
      const badge = svg("g", { class: `problem-node-slot${slot.tone ? ` is-${slot.tone}` : ""}`, transform: `translate(${slot.x} ${slot.y})` });
      badge.appendChild(svg("rect", { x: 0, y: 0, width: 112, height: 48, rx: 8, class: "problem-node-slot-bg" }));
      const label = svg("text", { x: 12, y: 21, class: "problem-node-slot-title" });
      label.textContent = `${slot.node} = ${slot.value}`;
      const sub = svg("text", { x: 12, y: 38, class: "problem-node-slot-subtitle" });
      sub.textContent = slot.sub;
      badge.appendChild(label);
      badge.appendChild(sub);
      group.appendChild(badge);
    });

    el.annotationLayer.appendChild(group);
    return group;
  }

  function drawTraceStepCard(step) {
    drawFormulaCard(
      step.cardX || 536,
      step.cardY || 84,
      step.title,
      step.lines,
      step.note,
      {
        width: step.width || 420,
        tone: step.tone,
      },
    );
  }

  function renderReverseTraceStep(step, state) {
    clearLayer(el.activeRouteLayer);
    clearAnnotations();
    setEdgeStates({ visible: step.visible, focus: step.focus || step.visible, context: step.contextEdges || [] });
    setNodeStates(state, { focus: step.nodes, target: [step.target], context: step.contextNodes || [] });
    drawDependencyRoutes(step.routes || step.visible);
    if (step.useRibbon) drawReverseDependencyRibbon(step.ribbonX || 48, step.ribbonY || 430);
    else drawTraceStepCard(step);
    renderRouteList(step.rows || []);
    el.routeCountLabel.textContent = step.countLabel || "truy ngược";
    setMetrics(step.metrics[0], step.metrics[1], step.metrics[2]);
  }

  function drawFormulaCard(x, y, title, lines, note, options = {}) {
    const width = options.width || 330;
    const height = 74 + lines.length * 24 + (note ? 24 : 0);
    const group = svg("g", { transform: `translate(${x} ${y})` });
    group.appendChild(
      svg("rect", {
        x: 0,
        y: 0,
        width,
        height,
        rx: 8,
        class: `formula-card${options.tone ? ` is-${options.tone}` : ""}`,
      }),
    );
    const titleEl = svg("text", { x: 18, y: 24, class: "formula-title" });
    titleEl.textContent = title;
    group.appendChild(titleEl);

    lines.forEach((line, index) => {
      const text = svg("text", { x: 18, y: 56 + index * 24, class: "formula-text" });
      text.textContent = line;
      group.appendChild(text);
    });

    if (note) {
      const noteEl = svg("text", { x: 18, y: height - 18, class: "formula-note" });
      noteEl.textContent = note;
      group.appendChild(noteEl);
    }

    (el.annotationLayer || el.cutLayer).appendChild(group);
    return group;
  }

  function setComparisonCards(cards) {
    const columns = [...el.comparisonPanel.querySelectorAll(".comparison-col")];
    columns.forEach((column, index) => {
      const card = cards[index];
      if (!card) return;
      column.classList.toggle("is-better", card.tone === "better");
      column.classList.toggle("is-next", card.tone === "next");
      column.querySelector("span").textContent = card.label;
      column.querySelector("strong").textContent = card.value;
      column.querySelector("p").textContent = card.body;
    });
  }

  function enterPart2ReverseScene() {
    const tl = makeTimeline();
    const state = makePart2State({
      F: ["unknown", null, "?"],
      G: ["unknown", null, "?"],
      K: ["unknown", null, "F/G"],
    });

    setEdgeStates({ visible: [part2Edges.toK], focus: [part2Edges.toK] });
    setNodeStates(state, { focus: ["F", "G", "K"] });
    renderRouteList([
      { label: "K chỉ có hai cửa vào trực tiếp", cost: "F / G", status: "current" },
      { label: "Qua F", cost: "tốt F + 4", status: "best" },
      { label: "Qua G", cost: "tốt G + 2", status: "best" },
    ]);
    el.routeCountLabel.textContent = "nhìn từ đích";
    drawCandidateRoutes([
      ["F", "K"],
      ["G", "K"],
    ]);
    el.metricStrip.classList.add("is-hidden");
    drawCandidateBadges(state, ["F", "G", "K"], {
      showCosts: false,
      labels: {
        F: "tốt F + 4",
        G: "tốt G + 2",
        K: "lấy nhánh rẻ hơn",
      },
      toneMap: { K: "correct" },
      offsets: {
        F: { x: -160, y: -48 },
        G: { x: -164, y: -96 },
        K: { x: -172, y: -98 },
      },
    });
    drawFormulaCard(
      540,
      84,
      "Đường tốt tới K",
      ["= tốt tới F + 4", "hoặc tốt tới G + 2"],
      "K chưa được giải; nó biến thành câu hỏi về F/G.",
      { width: 418 },
    );
    setMetrics("K hỏi F/G", "F+4 hoặc G+2", "chưa biết");

    tl.fromTo(".stage-copy", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: dur(0.55), ease: "power3.out" });
    // Animate layer + opacity riêng: gán y lên children sẽ ghi đè mất
    // translate(x y) gốc của từng card SVG.
    tl.fromTo(el.annotationLayer, { y: -10 }, { y: 0, duration: dur(0.42), ease: "power3.out" }, "<0.12");
    tl.fromTo(el.annotationLayer.children, { opacity: 0 }, { opacity: 1, duration: dur(0.42), ease: "power3.out" }, "<");
    tl.fromTo(".node-group.is-focus", { scale: 0.82, opacity: 0 }, { scale: 1, opacity: 1, stagger: dur(0.08), duration: dur(0.45), ease: "back.out(1.55)" }, "<0.08");
    tl.fromTo(".edge-group.is-focus, .edge-label-group.is-focus", { opacity: 0 }, { opacity: 1, duration: dur(0.45), ease: "power2.out" }, "<0.1");
    return tl;
  }

  function enterPart2ProblemShiftScene() {
    const tl = makeTimeline();
    const state = makePart2State({
      A: ["settled", 0, "-"],
      B: ["unknown", null, "?"],
      C: ["unknown", null, "?"],
      D: ["unknown", null, "?"],
      E: ["unknown", null, "?"],
      F: ["unknown", null, "?"],
      G: ["unknown", null, "?"],
      K: ["unknown", null, "F/G"],
    });

    setEdgeStates({
      context: [part2Edges.fromA, part2Edges.fromC, part2Edges.fromB, part2Edges.fromE, part2Edges.fromD, part2Edges.toK],
    });
    setNodeStates(state, { focus: part2NodeOrder, correct: ["A"], target: ["K"] });
    renderRouteList([
      { label: "Đã biết", cost: "A = 0", status: "best" },
      { label: "Cần tìm", cost: "C, B, D, E = ?", status: "current" },
      { label: "Cần tìm", cost: "F, G, K = ?", status: "current" },
    ]);
    el.routeCountLabel.textContent = "mọi đỉnh";
    el.metricStrip.classList.add("is-hidden");

    drawProblemShiftVisual();
    setMetrics("mọi đỉnh", "A = 0", "còn lại ?");

    gsap.set(".problem-overview-card, .problem-node-slot", { opacity: 0 });
    tl.fromTo(".stage-copy", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: dur(0.55), ease: "power3.out" });
    tl.fromTo(".edge-group.is-context, .edge-label-group.is-context", { opacity: 0 }, { opacity: 0.42, duration: dur(0.42), ease: "power2.out" }, 0.2);
    tl.fromTo(".node-group.is-focus, .node-group.is-target", { scale: 0.84, opacity: 0 }, { scale: 1, opacity: 1, stagger: dur(0.045), duration: dur(0.44), ease: "back.out(1.45)" }, 0.28);
    tl.fromTo(".problem-overview-card", { opacity: 0 }, { opacity: 1, duration: dur(0.38), ease: "power3.out" }, 0.62);
    tl.fromTo(".problem-node-slot", { opacity: 0 }, { opacity: 1, stagger: dur(0.04), duration: dur(0.28), ease: "power3.out" }, 0.82);

    return tl;
  }

  function enterPart2TraceScene(stepIndex) {
    const tl = makeTimeline();
    const traceState = makePart2State({
      A: ["unknown", null, "?"],
      B: ["unknown", null, "?"],
      C: ["unknown", null, "?"],
      D: ["unknown", null, "?"],
      E: ["unknown", null, "?"],
      F: ["unknown", null, "?"],
      G: ["unknown", null, "?"],
      K: ["unknown", null, "F/G"],
    });

    const steps = [
      {
        target: "K",
        nodes: ["F", "G", "K"],
        visible: [[["F", "K"], ["G", "K"]]],
        routes: [
          ["F", "K"],
          ["G", "K"],
        ],
        useRibbon: true,
        title: "K hỏi F/G",
        lines: ["Muốn tới K,", "phải biết tốt tới F hoặc G."],
        note: "Ta chọn một nhánh để nhìn sâu hơn.",
        metrics: ["đích K", "F hoặc G", "chọn F để truy tiếp"],
        rows: [
          { label: "Tốt tới K", cost: "min(F+4, G+2)", status: "current" },
          { label: "Nếu qua F", cost: "tốt F + 4", status: "best" },
          { label: "Nếu qua G", cost: "tốt G + 2", status: "best" },
        ],
      },
      {
        target: "F",
        nodes: ["D", "E", "F"],
        contextNodes: ["F", "G", "K"],
        visible: [[["D", "F"], ["E", "F"]]],
        contextEdges: [[["F", "K"], ["G", "K"]]],
        routes: [
          ["D", "F"],
          ["E", "F"],
        ],
        title: "Zoom vào F",
        lines: ["Giờ coi F là đích mới.", "F lại cần D hoặc E trước."],
        note: "F/G -> K vẫn ở nền; ta chỉ đào sâu nhánh F.",
        cardX: 646,
        cardY: 94,
        width: 330,
        metrics: ["đích tạm F", "D hoặc E", "lặp lại câu hỏi"],
        countLabel: "đích tạm: F",
        rows: [
          { label: "Tốt tới F", cost: "min(D+2, E+2)", status: "current" },
          { label: "Nếu qua D", cost: "tốt D + 2", status: "best" },
          { label: "Nếu qua E", cost: "tốt E + 2", status: "best" },
        ],
      },
      {
        target: "E",
        nodes: ["A", "B", "E"],
        contextNodes: ["D", "E", "F", "K"],
        visible: [[["A", "E"], ["B", "E"]]],
        contextEdges: [[["D", "F"], ["E", "F"], ["F", "K"]]],
        routes: [
          ["A", "E"],
          ["B", "E"],
        ],
        title: "Zoom tiếp vào E",
        lines: ["Muốn biết tốt tới E,", "lại phải biết A hoặc B trước."],
        note: "Câu hỏi đã kéo gần về điểm xuất phát.",
        metrics: ["đích tạm E", "A hoặc B", "gần A hơn"],
        countLabel: "đích tạm: E",
        rows: [
          { label: "Tốt tới E", cost: "min(A+6, B+1)", status: "current" },
          { label: "A là gốc", cost: "đã biết 0", status: "best" },
          { label: "B vẫn là câu hỏi", cost: "hỏi tiếp", status: "current" },
        ],
      },
      {
        target: "B",
        nodes: ["A", "C", "B"],
        contextNodes: ["B", "E", "F", "K"],
        visible: [[["A", "B"], ["C", "B"]]],
        contextEdges: [[["B", "E"], ["E", "F"], ["F", "K"]]],
        routes: [
          ["A", "B"],
          ["C", "B"],
        ],
        title: "Thêm một lớp nữa",
        lines: ["Muốn biết tốt tới B,", "lại phải biết A hoặc C trước."],
        note: "Cứ truy như vậy, cuối cùng phải quay về A.",
        cardX: 612,
        cardY: 86,
        width: 356,
        metrics: ["đích tạm B", "A hoặc C", "quay về A"],
        countLabel: "đích tạm: B",
        rows: [
          { label: "Tốt tới B", cost: "min(A+4, C+1)", status: "current" },
          { label: "A đã chắc chắn", cost: "0", status: "best" },
          { label: "C sẽ được xét từ A", cost: "scene sau", status: "current" },
        ],
      },
    ];
    const cameras = [
      null,
      { center: { x: 548, y: 374 }, scale: 1.3 },
      { center: { x: 426, y: 366 }, scale: 1.32 },
      { center: { x: 304, y: 348 }, scale: 1.4 },
    ];
    const step = steps[stepIndex] || steps[0];
    const camera = cameras[stepIndex] || null;
    const previousCamera = camera ? cameras[stepIndex - 1] || null : null;

    el.metricStrip.classList.add("is-hidden");
    renderReverseTraceStep(step, traceState);
    if (previousCamera && el.cameraLayer) {
      el.cameraLayer.setAttribute("transform", cameraMatrix(previousCamera.center, previousCamera.scale));
    }

    const enteringNodes = camera ? ".node-group.is-focus:not(.is-context):not(.is-target)" : ".node-group.is-focus";
    const enteringEdges = camera ? ".edge-group.is-focus:not(.is-context)" : ".edge-group.is-focus";
    const enteringLabels = camera ? ".edge-label-group.is-focus:not(.is-context)" : ".edge-label-group.is-focus";
    gsap.set(enteringNodes, { scale: 0.84, autoAlpha: 0, transformOrigin: "center center" });
    gsap.set(`${enteringEdges}, ${enteringLabels}`, { autoAlpha: 0 });
    gsap.set(".route-dependency", { opacity: 0, strokeDashoffset: 40 });

    const annotationAt = camera ? 0.5 : 0.1;
    const revealAt = camera ? 0.62 : 0.08;
    const routeAt = camera ? 0.66 : 0.16;

    if (camera) moveCameraOnTimeline(tl, camera.center, camera.scale, 0);
    tl.fromTo(".stage-copy", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: dur(0.55), ease: "power3.out" }, 0);
    tl.fromTo(el.annotationLayer, { y: -12 }, { y: 0, duration: dur(0.42), ease: "power3.out" }, annotationAt);
    tl.fromTo(el.annotationLayer.children, { opacity: 0 }, { opacity: 1, duration: dur(0.42), ease: "power3.out" }, annotationAt);
    tl.fromTo(enteringNodes, { scale: 0.84, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, stagger: dur(0.06), duration: dur(0.42), ease: "back.out(1.45)" }, revealAt);
    tl.fromTo(".route-dependency", { opacity: 0, strokeDashoffset: 40 }, { opacity: 0.62, strokeDashoffset: 0, stagger: dur(0.035), duration: dur(0.45), ease: "power2.out" }, routeAt);
    tl.fromTo(`${enteringEdges}, ${enteringLabels}`, { autoAlpha: 0 }, { autoAlpha: 1, duration: dur(0.46), ease: "power2.out" }, "<");

    return tl;
  }

  function enterPart2FrontierScene() {
    const tl = makeTimeline();
    const state = part2States.start;

    setEdgeStates({ visible: [part2Edges.fromA], focus: [part2Edges.fromA] });
    setNodeStates(state, { focus: ["A", "C", "B", "D", "E"] });
    renderDijkstraTable(state, { focus: ["C", "B", "D", "E"], showCosts: false });
    clearAnnotations();
    drawCandidateRoutes([
      ["A", "C"],
      ["A", "B"],
      ["A", "D"],
      ["A", "E"],
    ]);
    setMetrics("A = 0", "chuẩn bị mở", "phần xa ẩn");

    const revealPlan = [
      { node: "C", edge: "A:C", route: "A-C", at: 0.86 },
      { node: "B", edge: "A:B", route: "A-B", at: 1.04 },
      { node: "E", edge: "A:E", route: "A-E", at: 1.22 },
      { node: "D", edge: "A:D", route: "A-D", at: 1.4 },
    ];
    const hiddenNodes = part2NodeOrder.filter((node) => node !== "A").map((node) => `.node-${node}`).join(", ");
    const hiddenEdges = revealPlan.map((step) => `.edge-group[data-edge="${step.edge}"]`).join(", ");
    const hiddenLabels = revealPlan.map((step) => `.edge-label-group[data-edge="${step.edge}"]`).join(", ");
    const hiddenRoutes = revealPlan.map((step) => `.route-candidate[data-route="${step.route}"]`).join(", ");
    const hiddenRows = revealPlan.map((step) => `.state-row[data-node="${step.node}"]`).join(", ");

    gsap.set(hiddenNodes, { opacity: 0, scale: 0.86, transformOrigin: "center center" });
    gsap.set(`${hiddenEdges}, ${hiddenLabels}, ${hiddenRoutes}`, { opacity: 0 });
    gsap.set(hiddenRows, { opacity: 0, y: 8 });

    tl.fromTo(".stage-copy", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: dur(0.55), ease: "power3.out" }, 0);
    moveCameraOnTimeline(tl, part2Cameras.aTight.center, part2Cameras.aTight.scale, 0.02, 0.68);
    tl.fromTo(".node-A", { scale: 0.92 }, { scale: 1.08, yoyo: true, repeat: 1, duration: dur(0.24), ease: "power2.inOut" }, 0.46);
    moveCameraOnTimeline(tl, part2Cameras.frontier.center, part2Cameras.frontier.scale, 0.74, 1.05);
    revealPlan.forEach((step) => {
      tl.to(`.edge-group[data-edge="${step.edge}"], .edge-label-group[data-edge="${step.edge}"], .route-candidate[data-route="${step.route}"]`, { opacity: 1, duration: dur(0.28), ease: "power2.out" }, step.at);
      tl.to(`.node-${step.node}`, { opacity: 1, scale: 1, duration: dur(0.32), ease: "back.out(1.45)" }, step.at + 0.02);
      tl.to(`.state-row[data-node="${step.node}"]`, { opacity: 1, y: 0, duration: dur(0.25), ease: "power2.out" }, step.at + 0.08);
    });
    tl.call(() => setMetrics("A mở 4 đỉnh", "chưa chốt đỉnh nào", "suy tiếp"), [], 1.72);
    return tl;
  }

  function enterPart2FirstQuizScene() {
    const tl = makeTimeline();
    const state = part2States.start;
    const candidates = ["C", "B", "D", "E"];
    const wrongInfo = {
      B: {
        path: ["A", "C", "B"],
        metric: "A -> C -> B = 3",
        ghostLabel: "3",
        labelT: 0.72,
        labelDx: 16,
        labelDy: 6,
      },
      D: {
        path: ["A", "C", "D"],
        metric: "A -> C -> D = 5",
        ghostLabel: "5",
      },
      E: {
        path: ["A", "C", "E"],
        metric: "A -> C -> E = 5",
        ghostLabel: "5",
      },
    };

    setCameraView(part2Cameras.frontier);
    setEdgeStates({ visible: [part2Edges.fromA], focus: [part2Edges.fromA] });
    setNodeStates(state, { focus: candidates, clickable: candidates });
    renderDijkstraTable(state, { focus: candidates, showCosts: false });
    el.metricStrip.classList.add("is-hidden");
    clearAnnotations();
    setMetrics("chọn một đỉnh", "đang mở", "chưa bật mí");

    setupCandidateQuiz({
      candidates,
      answer: "C",
      title: "Thử chốt một đỉnh",
      status: "C/B/D/E",
      candidateMeta: {
        C: "cạnh A → C",
        B: "cạnh A → B",
        D: "cạnh A → D",
        E: "cạnh A → E",
      },
      onWrong: (node) => {
        const info = wrongInfo[node];
        if (!info) return;
        clearAnnotations();
        animateCameraTo(part2Cameras.frontier, 0.44);
        setNodeStates(state, { focus: candidates, wrong: [node], clickable: candidates });
        renderDijkstraTable(state, { focus: [node, "C"], showCosts: false });
        drawGhostRoute(info.path, {
          offset: 22,
          costLabel: info.ghostLabel,
          labelT: info.labelT,
          labelDx: info.labelDx,
          labelDy: info.labelDy,
        });
        setMetrics(`${node} chưa chắc`, info.metric, "C mở ra phản ví dụ");
        el.workbenchStatus.textContent = "chưa chắc";
      },
      onCorrect: () => {
        clearLayer(el.cutLayer);
        clearAnnotations();
        animateCameraTo(part2Cameras.frontier, 0.44);
        setEdgeStates({
          visible: [part2Edges.fromA, part2Edges.fromC],
          focus: [part2Edges.fromC],
          locked: [[["A", "C"]]],
        });
        setNodeStates(part2States.afterC, { focus: ["C", "B", "D"], correct: ["C"] });
        renderDijkstraTable(part2States.afterC, { focus: ["C", "B", "D"], showCosts: false });
        showBestRoute(["A", "C"]);
        setMetrics("chốt C", "đường vòng nào cũng ≥ 4", "C chắc chắn");
        el.workbenchStatus.textContent = "đúng";
      },
    });

    tl.fromTo(".stage-copy", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: dur(0.55), ease: "power3.out" });
    tl.fromTo(el.workbench, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: dur(0.42), ease: "power3.out" }, "<0.1");
    return tl;
  }

  function enterPart2AfterCScene() {
    const tl = makeTimeline();
    const candidates = ["B", "D", "E"];
    const wrongInfo = {
      D: {
        pathData: () => virtualArc("B", "D", 58),
        metric: "B = 3",
        status: "đợi B trước",
        ghostLabel: "3",
      },
      E: {
        pathData: () => virtualArc("B", "E", -34),
        metric: "qua B = 4",
        status: "chưa chốt E",
        ghostLabel: "4",
      },
    };

    setCameraView(part2Cameras.frontier);
    setEdgeStates({
      visible: [part2Edges.fromA, part2Edges.fromC],
      focus: [[["C", "B"]]],
      locked: [[["A", "C"]]],
    });
    setNodeStates(part2States.afterC, { focus: candidates, clickable: candidates });
    renderDijkstraTable(part2States.afterC, { focus: candidates, showCosts: false });
    showBestRoute(["A", "C"]);
    el.metricStrip.classList.add("is-hidden");
    clearAnnotations();
    setMetrics("C đã chốt", "đường mới qua C", "hãy chọn tiếp");

    setupCandidateQuiz({
      candidates,
      answer: "B",
      title: "Bây giờ chốt ai?",
      status: "B/D/E",
      candidateMeta: {
        B: "đường A → C → B",
        D: "đường A → C → D",
        E: "đường A → E",
      },
      onWrong: (node) => {
        const info = wrongInfo[node];
        if (!info) return;
        clearAnnotations();
        animateCameraTo(part2Cameras.frontier, 0.44);
        setNodeStates(part2States.afterC, { focus: ["B", node], wrong: [node], clickable: candidates });
        renderDijkstraTable(part2States.afterC, { focus: ["B", node], showCosts: false });
        drawGhostRoute(info.pathData ? info.pathData() : info.path, { offset: info.offset || 22, label: `${node}-wrong`, costLabel: info.ghostLabel });
        setMetrics(`${node} chưa chắc`, info.metric, info.status);
        el.workbenchStatus.textContent = "chưa chắc";
      },
      onCorrect: () => {
        clearLayer(el.cutLayer);
        clearAnnotations();
        animateCameraTo(part2Cameras.frontier, 0.44);
        setEdgeStates({
          visible: [part2Edges.fromA, part2Edges.fromC, part2Edges.fromB],
          focus: [part2Edges.fromB],
          locked: [[["A", "C"], ["C", "B"]]],
        });
        setNodeStates(part2States.afterB, { focus: ["B", "E"], correct: ["B"] });
        renderDijkstraTable(part2States.afterB, { focus: ["B", "E"], showCosts: false });
        showBestRoute(["A", "C", "B"]);
        setMetrics("chốt B", "đường mới qua B", "tiếp theo E");
        el.workbenchStatus.textContent = "đúng";
      },
    });

    tl.fromTo(".stage-copy", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: dur(0.55), ease: "power3.out" });
    tl.fromTo(el.workbench, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: dur(0.42), ease: "power3.out" }, "<0.1");
    return tl;
  }

  function enterPart2MinRuleScene() {
    const tl = makeTimeline();

    const revealCostQuiz = () => {
      clearAnnotations();
      renderDijkstraTable(part2States.afterB, { focus: ["D", "E"] });
      setNodeStates(part2States.afterB, { focus: ["D", "E"], clickable: ["D", "E"], showNodeCosts: true, nodeCostNodes: ["D", "E"] });
      setMetrics("D=5, E=4", "E nhỏ nhất", "chọn E");

      setupCandidateQuiz({
        candidates: ["D", "E"],
        answer: "E",
        title: "Đỉnh nào nhỏ hơn?",
        status: "D/E",
        advanceLabel: "Chọn min",
        candidateMeta: {
          D: "cost 5",
          E: "cost 4",
        },
        onWrong: (node) => {
          clearAnnotations();
          animateCameraTo(part2Cameras.frontier, 0.44);
          setNodeStates(part2States.afterB, { focus: ["E", node], wrong: [node], clickable: ["D", "E"], showNodeCosts: true, nodeCostNodes: ["D", "E"] });
          renderDijkstraTable(part2States.afterB, { focus: ["E", node] });
          drawGhostRoute(virtualArc("E", "D", -44), { label: `${node}-wrong-min`, costLabel: "4" });
          setMetrics(`${node} chưa chắc`, "E = 4", "chọn E");
          el.workbenchStatus.textContent = "chọn E";
        },
        onCorrect: () => {
          clearLayer(el.cutLayer);
          clearAnnotations();
          animateCameraTo(part2Cameras.middle, 0.68);
          setEdgeStates({
            visible: [part2Edges.fromA, part2Edges.fromC, part2Edges.fromB, part2Edges.fromE],
            focus: [part2Edges.fromE],
            locked: [[["A", "C"], ["C", "B"], ["B", "E"]]],
          });
          setNodeStates(part2States.afterE, { focus: ["E", "F", "G"], correct: ["E"], showNodeCosts: true });
          renderDijkstraTable(part2States.afterE, { focus: ["E", "F", "G"] });
          showBestRoute(["A", "C", "B", "E"]);
          setMetrics("chốt E", "F=6, G=9", "tiếp tục");
          el.workbenchStatus.textContent = "đúng";
        },
      });
    };

    setCameraView(part2Cameras.frontier);
    setEdgeStates({
      visible: [part2Edges.fromA, part2Edges.fromC, part2Edges.fromB],
      focus: [part2Edges.fromB],
      locked: [[["A", "C"], ["C", "B"]]],
    });
    setNodeStates(part2States.afterB, { focus: ["D", "E"] });
    renderDijkstraTable(part2States.afterB, { focus: ["D", "E"], showCosts: false });
    showBestRoute(["A", "C", "B"]);
    el.metricStrip.classList.add("is-hidden");
    clearAnnotations();
    setMetrics("D và E", "cost đang ẩn", "nhấn Hiện cost");

    setupActionButton(
      "Hiện cost",
      revealCostQuiz,
      { title: "Bật cost để so sánh", status: "chờ" },
    );

    tl.fromTo(".stage-copy", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: dur(0.55), ease: "power3.out" });
    tl.fromTo(el.workbench, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: dur(0.42), ease: "power3.out" }, "<0.1");
    return tl;
  }

  function enterPart2RunToKScene() {
    const tl = makeTimeline();
    const baseLocked = [
      ["A", "C"],
      ["C", "B"],
      ["B", "E"],
    ];
    const baseVisible = [part2Edges.fromA, part2Edges.fromC, part2Edges.fromB, part2Edges.fromE];

    const steps = [
      {
        node: "D",
        state: part2States.afterD,
        route: ["A", "C", "D"],
        focus: ["D", "F", "G"],
        visible: [baseVisible, part2Edges.fromD],
        edgeFocus: [part2Edges.fromD],
        locked: [baseLocked, [["C", "D"]]],
        metrics: ["chốt D", "D = 5", "F vẫn 6"],
        camera: part2Cameras.middle,
      },
      {
        node: "F",
        state: part2States.afterF,
        route: ["A", "C", "B", "E", "F"],
        focus: ["F", "K"],
        visible: [baseVisible, part2Edges.fromD, [["F", "K"]]],
        edgeFocus: [[["F", "K"]]],
        locked: [baseLocked, [["C", "D"], ["E", "F"]]],
        metrics: ["chốt F", "K = 10", "qua F"],
        camera: part2Cameras.toK,
      },
      {
        node: "G",
        state: part2States.afterG,
        route: ["A", "C", "B", "E", "G"],
        focus: ["G", "K"],
        visible: [baseVisible, part2Edges.fromD, part2Edges.toK],
        edgeFocus: [[["G", "K"]]],
        locked: [baseLocked, [["C", "D"], ["E", "F"], ["E", "G"]]],
        metrics: ["chốt G", "qua G = 11", "K giữ 10"],
        camera: part2Cameras.toK,
      },
      {
        node: "K",
        state: part2States.final,
        route: part2FinalPath,
        focus: ["K"],
        visible: [baseVisible, part2Edges.fromD, part2Edges.toK],
        edgeFocus: [[["F", "K"]]],
        locked: [baseLocked, [["E", "F"], ["F", "K"]]],
        metrics: ["chốt K", "cost = 10", "tới K"],
        camera: part2Cameras.full,
      },
    ];

    showPart2Workbench("Chạy tiếp", "Bấm từng bước để mở tiếp", "0/4", "is-action");
    el.workbench.classList.add("is-manual-steps");
    const stepButtons = steps.map((step, index) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "candidate-button manual-step-button";
      chip.dataset.stepIndex = String(index);
      chip.dataset.node = step.node;

      const title = document.createElement("strong");
      title.textContent = step.node;
      chip.appendChild(title);

      const subtitle = document.createElement("span");
      subtitle.textContent = step.metrics[1];
      chip.appendChild(subtitle);

      chip.addEventListener("click", () => applyManualStep(index));
      el.workloadGrid.appendChild(chip);
      return chip;
    });

    let currentManualStep = 0;

    function updateManualButtons() {
      const nextStep = steps[currentManualStep];
      const progress = (currentManualStep / steps.length) * 100;
      el.workbenchStatus.textContent = `${currentManualStep}/${steps.length}`;
      el.workloadProgressFill.style.width = `${progress}%`;

      stepButtons.forEach((button, index) => {
        const isDone = index < currentManualStep;
        const isNext = index === currentManualStep;
        button.disabled = !isNext;
        button.classList.toggle("is-correct", isDone);
        button.classList.toggle("is-next-step", isNext);
      });

      activeNodeClickHandler = nextStep
        ? (node) => {
            if (node === nextStep.node) applyManualStep(currentManualStep);
          }
        : null;

      // Bấm Tiếp = mở bước kế tiếp; hết 4 bước thì Tiếp mới chuyển scene.
      prepareVisualAdvance(
        nextStep ? () => applyManualStep(currentManualStep) : null,
        nextStep ? `Mở ${nextStep.node}` : null,
      );
    }

    function applyManualStep(index) {
      if (index !== currentManualStep) return;
      const step = steps[index];
      const nextStep = steps[index + 1];
      currentManualStep += 1;

      clearLayer(el.cutLayer);
      setEdgeStates({ visible: step.visible, focus: step.edgeFocus, locked: step.locked });
      setNodeStates(step.state, {
        focus: step.focus,
        correct: [step.node],
        clickable: nextStep ? [nextStep.node] : [],
        showNodeCosts: true,
      });
      renderDijkstraTable(step.state, { focus: step.focus });
      showBestRoute(step.route);
      setMetrics(step.metrics[0], step.metrics[1], step.metrics[2]);
      if (step.camera) animateCameraTo(step.camera, 0.58);
      updateManualButtons();
    }

    setCameraView(part2Cameras.middle);
    setEdgeStates({ visible: baseVisible, focus: [part2Edges.fromE], locked: [baseLocked] });
    setNodeStates(part2States.afterE, { focus: ["D", "F", "G"], clickable: ["D"], showNodeCosts: true });
    renderDijkstraTable(part2States.afterE, { focus: ["D", "F", "G"] });
    showBestRoute(["A", "C", "B", "E"]);
    setMetrics("sau E", "D=5, F=6, G=9", "bấm D");
    updateManualButtons();

    tl.fromTo(".stage-copy", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: dur(0.55), ease: "power3.out" });
    tl.fromTo(el.workbench, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: dur(0.42), ease: "power3.out" }, "<0.1");
    return tl;
  }

  function enterPart2IdeaScene() {
    const tl = makeTimeline();
    const allEdges = [part2Edges.fromA, part2Edges.fromC, part2Edges.fromB, part2Edges.fromE, part2Edges.fromD, part2Edges.toK];
    const finalEdges = [
      ["A", "C"],
      ["C", "B"],
      ["B", "E"],
      ["E", "F"],
      ["F", "K"],
    ];

    setEdgeStates({ visible: allEdges, locked: [finalEdges] });
    setNodeStates(part2States.final, { focus: ["A", "C", "B", "E", "F", "K"], showNodeCosts: true });
    renderDijkstraTable(part2States.final, { focus: ["K"] });
    showBestRoute(part2FinalPath);
    setMetrics("A -> C -> B -> E -> F -> K", "10", "chưa vào code");
    el.metricStrip.classList.add("is-hidden");
    setComparisonCards([
      { label: "Bài toán mới", value: "A-X", body: "Giữ cost tốt nhất hiện biết từ A tới từng đỉnh.", tone: "" },
      { label: "Đỉnh chắc chắn", value: "min", body: "Trong phần đang mở, cost nhỏ nhất là đỉnh có thể chốt.", tone: "better" },
      { label: "Mở rộng", value: "+", body: "Từ đỉnh vừa chốt, mở hàng xóm và chỉ cập nhật khi rẻ hơn.", tone: "next" },
    ]);
    el.comparisonPanel.setAttribute("aria-hidden", "false");

    tl.fromTo(".stage-copy", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: dur(0.55), ease: "power3.out" });
    tl.fromTo(".comparison-col", { y: 22, opacity: 0 }, { y: 0, opacity: 1, stagger: dur(0.12), duration: dur(0.55), ease: "power3.out" }, "<0.1");
    return tl;
  }

  function enterPart3FrameScene() {
    const tl = makeTimeline();
    const allEdges = [part2Edges.fromA, part2Edges.fromC, part2Edges.fromB, part2Edges.fromE, part2Edges.fromD, part2Edges.toK];
    const finalEdges = [
      ["A", "C"],
      ["C", "B"],
      ["B", "E"],
      ["E", "F"],
      ["F", "K"],
    ];

    setCameraView(part2Cameras.full);
    setEdgeStates({ visible: allEdges, locked: [finalEdges] });
    setNodeStates(part3EndReadyState, { focus: ["A", "C", "B", "E", "F", "K"], target: ["K"], showNodeCosts: true });
    showBestRoute(part2FinalPath);
    showMemoryPanel();
    showPart3Code("frame", "Khung hàm", "chờ viết");
    setMetrics("ý tưởng", "Cost / Visited / Prev", "sang mã giả");

    tl.fromTo(".stage-copy", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: dur(0.55), ease: "power3.out" });
    tl.fromTo(".route-best", { opacity: 0, strokeDashoffset: 60 }, { opacity: 1, strokeDashoffset: 0, duration: dur(0.52), ease: "power2.out" }, "<0.08");
    animateMemoryPanel(tl, 0.14);
    return tl;
  }

  function enterPart3CostScene() {
    const tl = makeTimeline();
    const initState = makePart2State({
      A: ["settled", 0, "-"],
      C: ["unknown", null, "-"],
      B: ["unknown", null, "-"],
      D: ["unknown", null, "-"],
      E: ["unknown", null, "-"],
      F: ["unknown", null, "-"],
      G: ["unknown", null, "-"],
      K: ["unknown", null, "-"],
    });

    setCameraView(part2Cameras.aTight);
    setEdgeStates({ context: [part2Edges.fromA] });
    setNodeStates(initState, { focus: ["A"], target: ["K"], context: ["C", "B", "D", "E"], showNodeCosts: true, nodeCostNodes: ["A"] });
    showMemoryPanel({ cost: { A: 0 }, focus: ["A"] });
    showPart3Code("cost", "Ghi Cost đầu tiên", "chờ viết");
    setMetrics("start = A", "Cost[A] = 0", "còn lại ?");

    tl.fromTo(".stage-copy", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: dur(0.55), ease: "power3.out" });
    tl.fromTo(".node-A", { scale: 0.92 }, { scale: 1.08, yoyo: true, repeat: 1, duration: dur(0.28), ease: "power2.inOut" }, "<0.1");
    animateMemoryPanel(tl, 0.2);
    return tl;
  }

  function enterPart3LoopScene() {
    const tl = makeTimeline();
    const initState = makePart2State({
      A: ["settled", 0, "-"],
      C: ["unknown", null, "-"],
      B: ["unknown", null, "-"],
      D: ["unknown", null, "-"],
      E: ["unknown", null, "-"],
      F: ["unknown", null, "-"],
      G: ["unknown", null, "-"],
      K: ["unknown", null, "-"],
    });

    setCameraView(part2Cameras.aTight);
    setEdgeStates({ context: [part2Edges.fromA] });
    setNodeStates(initState, { focus: ["A"], target: ["K"], context: ["C", "B", "D", "E"], showNodeCosts: true, nodeCostNodes: ["A"] });
    showMemoryPanel({ cost: { A: 0 }, focus: ["A"] });
    showPart3Code("loop", "Vòng lặp và chỗ dừng tạm", "chờ viết");
    drawCandidateRoutes([
      ["A", "C"],
      ["A", "B"],
      ["A", "D"],
      ["A", "E"],
    ]);
    gsap.set(".route-candidate", { opacity: 0 });
    setMetrics("A có cost 0", "mở hàng xóm", "lặp tiếp");

    tl.fromTo(".stage-copy", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: dur(0.55), ease: "power3.out" });
    tl.fromTo(".node-A", { scale: 0.94 }, { scale: 1.1, yoyo: true, repeat: 1, duration: dur(0.3), ease: "power2.inOut" }, "<0.1");
    animateMemoryPanel(tl, 0.18);
    moveCameraOnTimeline(tl, part3LoopCamera.center, part3LoopCamera.scale, 0.28, 0.72);
    tl.call(() => {
      setEdgeStates({ visible: [part2Edges.fromA], focus: [part2Edges.fromA] });
      setMetrics("A đã chọn", "C/B/D/E", "vùng mở mới");
    }, null, 0.52);
    tl.fromTo(
      ".route-candidate",
      { opacity: 0, strokeDashoffset: 52 },
      { opacity: 0.64, strokeDashoffset: 0, stagger: dur(0.08), duration: dur(0.42), ease: "power2.out" },
      0.56,
    );
    tl.call(() => {
      setNodeStates(part2States.start, {
        focus: ["C", "B", "D", "E"],
        correct: ["A"],
        target: ["K"],
        showNodeCosts: true,
        nodeCostNodes: ["A", "C", "B", "D", "E"],
      });
      showMemoryPanel({
        cost: { A: 0, C: 2, B: 4, D: 7, E: 6 },
        visited: ["A"],
        focus: ["C", "B", "D", "E"],
        amber: ["C", "B", "D", "E"],
      });
      setMetrics("đang mở", "4 ứng viên", "cần vòng sau");
    }, null, 0.96);
    tl.fromTo(
      ".node-C, .node-B, .node-D, .node-E",
      { scale: 0.86, opacity: 0.36 },
      { scale: 1, opacity: 1, stagger: dur(0.055), duration: dur(0.34), ease: "back.out(1.45)" },
      0.98,
    );
    tl.fromTo(
      ".memory-chip.is-focus, .memory-chip.is-amber",
      { scale: 0.82, opacity: 0 },
      { scale: 1, opacity: 1, stagger: dur(0.04), duration: dur(0.28), ease: "back.out(1.5)" },
      1.05,
    );
    return tl;
  }

  function animatePart3SceneIntro(tl, memoryAt = 0.18) {
    tl.fromTo(".stage-copy", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: dur(0.55), ease: "power3.out" });
    animateMemoryPanel(tl, memoryAt);
    const introGraphVisualSelector = ".part3-graph-visual:not(.is-deferred)";
    if (document.querySelector(introGraphVisualSelector)) {
      prepareSvgPathDraw(`${introGraphVisualSelector} .part3-backtrack-path`);
      tl.fromTo(introGraphVisualSelector, { opacity: 0 }, { opacity: 1, duration: dur(0.34), ease: "power3.out" }, memoryAt + 0.12);
      if (document.querySelector(`${introGraphVisualSelector} .part3-backtrack-path`)) {
        tl.to(`${introGraphVisualSelector} .part3-backtrack-path`, { strokeDashoffset: 0, duration: dur(0.46), ease: "power2.out" }, memoryAt + 0.22);
      }
      const introGraphPartsSelector = `${introGraphVisualSelector} .part3-node-marker, ${introGraphVisualSelector} .part3-probe-cursor, ${introGraphVisualSelector} .part3-backtrack-label`;
      if (document.querySelector(introGraphPartsSelector)) {
        tl.fromTo(introGraphPartsSelector, { opacity: 0, scale: 0.82, transformOrigin: "center center" }, { opacity: 1, scale: 1, stagger: dur(0.045), duration: dur(0.28), ease: "back.out(1.5)" }, memoryAt + 0.28);
      }
    }
  }

  function pulsePart3Nodes(tl, nodeIds, at, options = {}) {
    const selector = nodeIds.map((node) => `.node-${node}`).join(", ");
    if (!selector) return;
    tl.fromTo(
      selector,
      { scale: options.fromScale || 0.92 },
      {
        scale: options.toScale || 1.12,
        yoyo: true,
        repeat: 1,
        stagger: dur(options.stagger || 0.05),
        duration: dur(options.duration || 0.24),
        ease: "power2.inOut",
      },
      at,
    );
  }

  function animateCandidateBadgesOnTimeline(tl, at = 0.18, stagger = 0.045) {
    tl.fromTo(
      ".candidate-badges > *",
      { opacity: 0, y: -8 },
      { opacity: 1, y: 0, stagger: dur(stagger), duration: dur(0.28), ease: "power3.out" },
      at,
    );
  }

  function prepareSvgPathDraw(selector) {
    document.querySelectorAll(selector).forEach((path) => {
      if (typeof path.getTotalLength !== "function") return;
      const length = Math.max(1, path.getTotalLength());
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
    });
  }

  function drawPart3GraphGroup(className) {
    const group = svg("g", { class: `part3-graph-visual ${className}` });
    el.activeRouteLayer.appendChild(group);
    return group;
  }

  function drawPart3Probe(startNode, className = "") {
    const point = nodes[startNode];
    const group = drawPart3GraphGroup(`part3-probe-visual ${className}`);
    const probe = svg("g", { class: "part3-probe-cursor", transform: `translate(${point.x} ${point.y})` });
    probe.appendChild(svg("circle", { r: 35, class: "part3-probe-ring" }));
    probe.appendChild(svg("circle", { r: 22, class: "part3-probe-core" }));
    group.appendChild(probe);
    return probe;
  }

  function animatePart3Probe(tl, order, at = 0.48) {
    if (!order.length) return;
    order.forEach((node, index) => {
      const point = nodes[node];
      const position = at + index * 0.13;
      tl.to(".part3-probe-cursor", { attr: { transform: `translate(${point.x} ${point.y})` }, duration: dur(0.12), ease: "power2.inOut" }, position);
      pulsePart3Nodes(tl, [node], position + 0.02, { toScale: index === order.length - 1 ? 1.14 : 1.08, duration: 0.16 });
    });
  }

  function drawPart3NodeMarker(node, { tone = "focus", symbol = "check", className = "" } = {}) {
    const point = nodes[node];
    const group = drawPart3GraphGroup(`part3-node-marker-visual ${className}`);
    const marker = svg("g", {
      class: `part3-node-marker marker-node-${node} is-${tone} has-${symbol}`,
      transform: `translate(${point.x} ${point.y})`,
    });
    marker.appendChild(svg("circle", { r: 38, class: "part3-node-marker-ring" }));
    if (symbol === "x") {
      marker.appendChild(svg("line", { x1: -11, y1: -11, x2: 11, y2: 11, class: "part3-node-marker-x" }));
      marker.appendChild(svg("line", { x1: 11, y1: -11, x2: -11, y2: 11, class: "part3-node-marker-x" }));
    }
    if (symbol === "check") {
      marker.appendChild(svg("path", { d: "M -16 1 L -5 13 L 18 -15", class: "part3-node-marker-check" }));
    }
    if (symbol === "stop") {
      marker.appendChild(svg("rect", { x: -16, y: -16, width: 32, height: 32, rx: 8, class: "part3-node-marker-stop" }));
    }
    if (symbol === "question") {
      const text = svg("text", { x: 0, y: 2, class: "part3-node-marker-question" });
      text.textContent = "?";
      marker.appendChild(text);
    }
    group.appendChild(marker);
    return marker;
  }

  // The running-minimum token: a small "min" card that latches onto the
  // cheapest open vertex found so far. It is the on-screen twin of the `min`
  // variable in the pseudocode — it slides to a new node only when that node
  // beats the value it is already holding.
  function drawPart3MinHolder(node, { value = null, className = "" } = {}) {
    const point = nodes[node];
    const group = drawPart3GraphGroup(`part3-min-holder-visual ${className}`);
    const holder = svg("g", {
      class: "part3-min-holder",
      transform: `translate(${point.x + MIN_HOLDER_DX} ${point.y + MIN_HOLDER_DY})`,
    });

    // Anchor halo that rings the node currently held (node sits at -DX,-DY).
    const anchor = svg("g", { class: "part3-min-holder-anchor", transform: `translate(${-MIN_HOLDER_DX} ${-MIN_HOLDER_DY})` });
    anchor.appendChild(svg("circle", { r: 31, class: "part3-min-holder-halo" }));
    holder.appendChild(anchor);

    // Tether from the card toward the node it points at.
    holder.appendChild(svg("line", { x1: -52, y1: 6, x2: -MIN_HOLDER_DX + 24, y2: -MIN_HOLDER_DY - 6, class: "part3-min-holder-stem" }));

    holder.appendChild(svg("rect", { x: -56, y: -30, width: 112, height: 60, rx: 15, class: "part3-min-holder-shell" }));
    const tag = svg("text", { x: -40, y: -11, class: "part3-min-holder-tag" });
    tag.textContent = "min";
    holder.appendChild(tag);
    const who = svg("text", { x: -34, y: 14, class: "part3-min-holder-who" });
    who.textContent = value == null ? "" : node;
    holder.appendChild(who);
    const val = svg("text", { x: 18, y: 6, class: "part3-min-holder-value" });
    val.textContent = value == null ? "?" : String(value);
    holder.appendChild(val);

    group.appendChild(holder);
    return holder;
  }

  // Slide the min holder onto `node` and update the value/letter it shows.
  // `grab` makes the card pop (a new champion was found).
  function moveMinHolder(tl, selector, node, value, at, { grab = true } = {}) {
    const point = nodes[node];
    // The transform lives on the inner `.part3-min-holder` group, so move that
    // (not the outer wrapper `selector`) to avoid compounding translations.
    tl.to(`${selector} .part3-min-holder`, {
      attr: { transform: `translate(${point.x + MIN_HOLDER_DX} ${point.y + MIN_HOLDER_DY})` },
      duration: dur(grab ? 0.34 : 0.001),
      ease: "power3.inOut",
    }, at);
    tl.call(() => {
      const card = document.querySelector(selector);
      if (!card) return;
      const valEl = card.querySelector(".part3-min-holder-value");
      const whoEl = card.querySelector(".part3-min-holder-who");
      if (valEl) valEl.textContent = String(value);
      if (whoEl) whoEl.textContent = node;
    }, null, at);
    if (grab) {
      tl.fromTo(`${selector} .part3-min-holder-shell`, { scale: 0.84, transformOrigin: "center center" }, { scale: 1, duration: dur(0.3), ease: "back.out(2)" }, at);
    }
  }

  // Small verdict chip dropped beside a node during the scan: "giữ" (green,
  // a new/kept champion) or a muted "n > m" loss.
  function drawPart3ScanTag(node, text, { tone = "lose", className = "", dx = 0, dy = 46 } = {}) {
    const point = nodes[node];
    const group = drawPart3GraphGroup(`part3-scan-tag-visual ${className}`);
    const tag = svg("g", { class: `part3-scan-tag is-${tone}`, transform: `translate(${point.x + dx} ${point.y + dy})` });
    const width = Math.max(44, String(text).length * 9 + 26);
    tag.appendChild(svg("rect", { x: -width / 2, y: -15, width, height: 30, rx: 9, class: "part3-scan-tag-bg" }));
    if (tone === "keep") {
      tag.appendChild(svg("path", { d: "M -18 0 L -12 6 L -2 -7", class: "part3-scan-tag-check" }));
    }
    const label = svg("text", { x: tone === "keep" ? 8 : 0, y: 1, class: "part3-scan-tag-text" });
    label.textContent = text;
    tag.appendChild(label);
    group.appendChild(tag);
    return tag;
  }

  // Soft "đã chốt" pill that replaces the old slammed red ✗. Marks a vertex as
  // settled / out of the running without shouting. `compact` drops the label to
  // a bare check ring when many nodes need marking at once.
  function drawPart3SettledTag(node, { className = "", label = "đã chốt", compact = false, dx = 0, dy = -46 } = {}) {
    const point = nodes[node];
    const group = drawPart3GraphGroup(`part3-settled-tag-visual ${className}`);
    const tag = svg("g", { class: `part3-settled-tag${compact ? " is-compact" : ""}`, transform: `translate(${point.x + dx} ${point.y + dy})` });
    if (compact) {
      tag.appendChild(svg("circle", { r: 15, class: "part3-settled-tag-disc" }));
      tag.appendChild(svg("path", { d: "M -7 0 L -2 5 L 7 -6", class: "part3-settled-tag-check" }));
    } else {
      const width = Math.max(78, String(label).length * 8 + 40);
      tag.appendChild(svg("rect", { x: -width / 2, y: -16, width, height: 32, rx: 16, class: "part3-settled-tag-bg" }));
      tag.appendChild(svg("path", { d: `M ${-width / 2 + 16} 0 L ${-width / 2 + 22} 6 L ${-width / 2 + 33} -7`, class: "part3-settled-tag-check" }));
      const text = svg("text", { x: 12, y: 1, class: "part3-settled-tag-text" });
      text.textContent = label;
      tag.appendChild(text);
    }
    group.appendChild(tag);
    return tag;
  }

  function drawPart3Packet({ from, to, text, tone = "focus", className = "", offset = 0, startT = 0.16, endT = 0.86 }) {
    const startPoint = pointBetween(nodes[from], nodes[to], startT);
    const endPoint = pointBetween(nodes[from], nodes[to], endT);
    const normal = lineNormal(nodes[from], nodes[to]);
    const start = { x: startPoint.x + normal.x * offset, y: startPoint.y + normal.y * offset };
    const end = { x: endPoint.x + normal.x * offset, y: endPoint.y + normal.y * offset };
    const group = svg("g", {
      class: `part3-packet is-${tone} ${className}`,
      transform: `translate(${start.x} ${start.y})`,
      "data-dx": String(end.x - start.x),
      "data-dy": String(end.y - start.y),
    });
    const width = Math.max(58, String(text).length * 11 + 22);
    group.appendChild(svg("rect", { x: -width / 2, y: -17, width, height: 34, rx: 9, class: "part3-packet-bg" }));
    const label = svg("text", { x: 0, y: 1, class: "part3-packet-text" });
    label.textContent = text;
    group.appendChild(label);
    el.activeRouteLayer.appendChild(group);
    return group;
  }

  function drawPart3FloatingChip(node, text, { tone = "focus", className = "", dx = 0, dy = 0 } = {}) {
    const point = nodes[node];
    const group = svg("g", {
      class: `part3-packet is-${tone} ${className}`,
      transform: `translate(${point.x + dx} ${point.y + dy})`,
    });
    const width = Math.max(42, String(text).length * 11 + 22);
    group.appendChild(svg("rect", { x: -width / 2, y: -17, width, height: 34, rx: 9, class: "part3-packet-bg" }));
    const label = svg("text", { x: 0, y: 1, class: "part3-packet-text" });
    label.textContent = text;
    group.appendChild(label);
    el.activeRouteLayer.appendChild(group);
    return group;
  }

  function drawPart3FlowChip({ from, to, text, tone = "focus", className = "", offset = 0, startT = 0.16, endT = 0.86 }) {
    const startPoint = pointBetween(nodes[from], nodes[to], startT);
    const endPoint = pointBetween(nodes[from], nodes[to], endT);
    const normal = lineNormal(nodes[from], nodes[to]);
    const start = { x: startPoint.x + normal.x * offset, y: startPoint.y + normal.y * offset };
    const end = { x: endPoint.x + normal.x * offset, y: endPoint.y + normal.y * offset };
    const group = svg("g", {
      class: `part3-packet is-${tone} ${className}`,
      transform: `translate(${start.x} ${start.y})`,
      "data-end-x": String(end.x),
      "data-end-y": String(end.y),
    });
    const width = Math.max(58, String(text).length * 11 + 22);
    group.appendChild(svg("rect", { x: -width / 2, y: -17, width, height: 34, rx: 9, class: "part3-packet-bg" }));
    const label = svg("text", { x: 0, y: 1, class: "part3-packet-text" });
    label.textContent = text;
    group.appendChild(label);
    el.activeRouteLayer.appendChild(group);
    return group;
  }

  function drawPart3CostSlot(node, { className = "", dx = -8, dy = -118 } = {}) {
    const point = nodes[node];
    const group = drawPart3GraphGroup(`part3-cost-slot-visual ${className}`);
    const slot = svg("g", {
      class: "part3-cost-slot",
      transform: `translate(${point.x + dx} ${point.y + dy})`,
    });
    slot.appendChild(svg("rect", { x: -76, y: -50, width: 152, height: 116, rx: 14, class: "part3-cost-slot-shell" }));
    const label = svg("text", { x: 0, y: -24, class: "part3-cost-slot-label" });
    label.textContent = `Cost[${node}]`;
    slot.appendChild(label);

    const current = svg("g", { class: "part3-cost-slot-chip slot-current" });
    current.appendChild(svg("rect", { x: -30, y: -7, width: 60, height: 48, rx: 12, class: "part3-cost-slot-chip-bg is-current" }));
    const currentText = svg("text", { x: 0, y: 19, class: "part3-cost-slot-value" });
    currentText.textContent = "6";
    current.appendChild(currentText);
    slot.appendChild(current);

    const bad = svg("g", { class: "part3-cost-slot-chip slot-bad" });
    bad.appendChild(svg("rect", { x: -30, y: -7, width: 60, height: 48, rx: 12, class: "part3-cost-slot-chip-bg is-bad" }));
    const badText = svg("text", { x: 0, y: 19, class: "part3-cost-slot-value" });
    badText.textContent = "7";
    bad.appendChild(badText);
    slot.appendChild(bad);

    const candidate = svg("g", { class: "part3-cost-slot-chip slot-candidate", transform: "translate(-156 58)" });
    candidate.appendChild(svg("rect", { x: -30, y: -24, width: 60, height: 48, rx: 12, class: "part3-cost-slot-chip-bg is-candidate" }));
    const candidateText = svg("text", { x: 0, y: 2, class: "part3-cost-slot-value" });
    candidateText.textContent = "7";
    candidate.appendChild(candidateText);
    slot.appendChild(candidate);

    const arrow = svg("path", { d: "M -120 58 C -82 46 -66 25 -40 18", class: "part3-cost-slot-arrow" });
    slot.appendChild(arrow);

    const ruler = svg("g", { class: "part3-cost-slot-ruler", transform: "translate(-112 91)" });
    ruler.appendChild(svg("line", { x1: 0, y1: 0, x2: 174, y2: 0, class: "part3-cost-ruler-line" }));
    ruler.appendChild(svg("line", { x1: 78, y1: -9, x2: 78, y2: 9, class: "part3-cost-ruler-tick is-current" }));
    ruler.appendChild(svg("line", { x1: 120, y1: -9, x2: 120, y2: 9, class: "part3-cost-ruler-tick is-candidate" }));
    const currentPin = svg("g", { class: "part3-cost-ruler-pin is-current", transform: "translate(78 -1)" });
    currentPin.appendChild(svg("circle", { r: 14, class: "part3-cost-ruler-pin-bg" }));
    const currentPinText = svg("text", { x: 0, y: 1, class: "part3-cost-ruler-pin-text" });
    currentPinText.textContent = "6";
    currentPin.appendChild(currentPinText);
    ruler.appendChild(currentPin);
    const candidatePin = svg("g", { class: "part3-cost-ruler-pin is-candidate", transform: "translate(120 -1)" });
    candidatePin.appendChild(svg("circle", { r: 14, class: "part3-cost-ruler-pin-bg" }));
    const candidatePinText = svg("text", { x: 0, y: 1, class: "part3-cost-ruler-pin-text" });
    candidatePinText.textContent = "7";
    candidatePin.appendChild(candidatePinText);
    ruler.appendChild(candidatePin);
    slot.appendChild(ruler);

    const gate = svg("g", { class: "part3-cost-slot-gate", transform: "translate(-44 17)" });
    gate.appendChild(svg("line", { x1: 0, y1: -34, x2: 0, y2: 34, class: "part3-cost-slot-gate-line" }));
    gate.appendChild(svg("path", { d: "M -15 -15 L 15 15 M 15 -15 L -15 15", class: "part3-cost-slot-gate-x" }));
    slot.appendChild(gate);

    const rejected = svg("g", { class: "part3-cost-slot-chip slot-rejected", transform: "translate(-94 58)" });
    rejected.appendChild(svg("rect", { x: -30, y: -24, width: 60, height: 48, rx: 12, class: "part3-cost-slot-chip-bg is-rejected" }));
    const rejectedText = svg("text", { x: 0, y: 2, class: "part3-cost-slot-value" });
    rejectedText.textContent = "7";
    rejected.appendChild(rejectedText);
    slot.appendChild(rejected);

    group.appendChild(slot);
    return group;
  }

  // Bảng quyết định "Cost[F]" xếp theo một dây chuyền duy nhất, đọc từ trái
  // sang phải: ứng viên đi vào -> cổng so sánh -> ô đang giữ số. Mỗi vùng có
  // chỗ riêng nên các bước không đè lên nhau. Bảng được neo lên khoảng trời
  // trống phía trên cạnh F-K để không che node F và hành động trên đồ thị.
  function drawPart3GuardDecisionBoard(node, { className = "", dx = 184, dy = -104 } = {}) {
    const point = nodes[node];
    const group = drawPart3GraphGroup(`part3-guard-decision-visual ${className}`);
    const board = svg("g", {
      class: "part3-guard-decision",
      transform: `translate(${point.x + dx} ${point.y + dy})`,
    });

    board.appendChild(svg("rect", { x: -160, y: -96, width: 320, height: 204, rx: 16, class: "part3-guard-shell" }));

    const title = svg("text", { x: -136, y: -66, class: "part3-guard-title" });
    title.textContent = `Cost[${node}]`;
    board.appendChild(title);

    const note = svg("text", { x: -136, y: -44, class: "part3-guard-note" });
    note.textContent = "giữ số tốt nhất đang biết";
    board.appendChild(note);

    const slotTransform = `translate(${GUARD_SLOT_POS.x} ${GUARD_SLOT_POS.y})`;
    const emptySlot = svg("g", { class: "part3-guard-slot guard-slot-empty", transform: slotTransform });
    emptySlot.appendChild(svg("rect", { x: -44, y: -32, width: 88, height: 64, rx: 14, class: "part3-guard-slot-bg is-empty" }));
    const emptyText = svg("text", { x: 0, y: 1, class: "part3-guard-slot-text is-muted" });
    emptyText.textContent = "trống";
    emptySlot.appendChild(emptyText);
    board.appendChild(emptySlot);

    const currentSlot = svg("g", { class: "part3-guard-slot guard-slot-current", transform: slotTransform });
    currentSlot.appendChild(svg("rect", { x: -44, y: -32, width: 88, height: 64, rx: 14, class: "part3-guard-slot-bg is-current" }));
    const currentText = svg("text", { x: 0, y: 2, class: "part3-guard-value" });
    currentText.textContent = "6";
    currentSlot.appendChild(currentText);
    board.appendChild(currentSlot);

    // Hai chip ứng viên cùng xuất phát từ một "cửa vào" bên trái; nguồn gốc
    // (từ E / từ D) ghi ngay trong chip nên không cần mũi tên phụ.
    const makeCandidate = (value, source, tone, chipClass) => {
      const chip = svg("g", { class: `part3-guard-chip ${chipClass}`, transform: `translate(${GUARD_CHIP_HOME.x} ${GUARD_CHIP_HOME.y})` });
      chip.appendChild(svg("rect", { x: -32, y: -24, width: 64, height: 48, rx: 12, class: `part3-guard-chip-bg is-${tone}` }));
      const valueText = svg("text", { x: 0, y: -5, class: "part3-guard-value" });
      valueText.textContent = value;
      chip.appendChild(valueText);
      const sourceText = svg("text", { x: 0, y: 15, class: "part3-guard-chip-src" });
      sourceText.textContent = source;
      chip.appendChild(sourceText);
      return chip;
    };
    board.appendChild(makeCandidate("6", "từ E", "current", "guard-candidate-six"));
    board.appendChild(makeCandidate("7", "từ D", "bad", "guard-candidate-seven"));

    const compare = svg("g", { class: "part3-guard-compare guard-compare", transform: "translate(16 -10)" });
    compare.appendChild(svg("rect", { x: -43, y: -17, width: 86, height: 34, rx: 10, class: "part3-guard-compare-bg" }));
    const compareText = svg("text", { x: 0, y: 1, class: "part3-guard-compare-text" });
    compareText.textContent = "7 < 6 ?";
    compare.appendChild(compareText);
    board.appendChild(compare);

    const gate = svg("g", { class: "part3-guard-gate guard-gate", transform: "translate(-6 40)" });
    // Rect thay vì line: line dọc có bbox rộng 0 nên filter glow nuốt mất nó.
    gate.appendChild(svg("rect", { x: -2.5, y: -42, width: 5, height: 84, rx: 2.5, class: "part3-guard-gate-line" }));
    gate.appendChild(svg("path", { d: "M -12 -12 L 12 12 M 12 -12 L -12 12", class: "part3-guard-gate-x" }));
    board.appendChild(gate);

    const reject = svg("g", { class: "part3-guard-reject guard-reject", transform: `translate(${GUARD_CHIP_HOME.x} 86)` });
    reject.appendChild(svg("rect", { x: -44, y: -15, width: 88, height: 30, rx: 10, class: "part3-guard-reject-bg" }));
    const rejectText = svg("text", { x: 0, y: 1, class: "part3-guard-reject-text" });
    rejectText.textContent = "không ghi";
    reject.appendChild(rejectText);
    board.appendChild(reject);

    const lost = svg("g", { class: "part3-guard-lost guard-lost", transform: `translate(${GUARD_SLOT_POS.x} 86)` });
    const lostText = svg("text", { x: 0, y: 1, class: "part3-guard-lost-text" });
    lostText.textContent = "6 bị mất";
    lost.appendChild(lostText);
    board.appendChild(lost);

    group.appendChild(board);
    return group;
  }

  function drawPart3PrevPathPanel({ className = "", x = 612, y = 514 } = {}) {
    const group = drawPart3GraphGroup(`part3-prev-path-panel-visual ${className}`);
    const panel = svg("g", { class: "part3-prev-path-panel", transform: `translate(${x} ${y})` });
    panel.appendChild(svg("rect", { x: -292, y: -82, width: 584, height: 164, rx: 16, class: "part3-prev-panel-shell" }));

    const rows = [
      { label: "Path[F]", route: ["A", "C", "B", "E", "F"], y: -36 },
      { label: "Path[K]", route: ["A", "C", "B", "E", "F", "K"], y: 36 },
    ];

    rows.forEach((row) => {
      const label = svg("text", { x: -254, y: row.y + 1, class: "part3-prev-path-label" });
      label.textContent = row.label;
      panel.appendChild(label);
      row.route.forEach((node, index) => {
        const chipX = -146 + index * 58;
        const chip = svg("g", {
          class: `part3-prev-path-chip${index < 5 ? " is-shared" : ""}`,
          transform: `translate(${chipX} ${row.y})`,
        });
        chip.appendChild(svg("rect", { x: -20, y: -20, width: 40, height: 40, rx: 10, class: "part3-prev-path-chip-bg" }));
        const text = svg("text", { x: 0, y: 1, class: "part3-prev-path-chip-text" });
        text.textContent = node;
        chip.appendChild(text);
        panel.appendChild(chip);
        if (index < row.route.length - 1) {
          const dash = svg("path", { d: `M ${chipX + 24} ${row.y} L ${chipX + 34} ${row.y}`, class: "part3-prev-path-dash" });
          panel.appendChild(dash);
        }
      });
    });

    const duplicate = svg("g", { class: "part3-prev-duplicate-mark", transform: "translate(1 -1)" });
    duplicate.appendChild(svg("rect", { x: -176, y: -64, width: 292, height: 128, rx: 13, class: "part3-prev-duplicate-bg" }));
    const duplicateText = svg("text", { x: -30, y: 75, class: "part3-prev-duplicate-text" });
    duplicateText.textContent = "đoạn đầu bị lưu lặp lại";
    duplicate.appendChild(duplicateText);
    panel.appendChild(duplicate);

    group.appendChild(panel);
    return group;
  }

  // Bảng "Khi nhận Cost[F]" dùng đúng kích thước, vị trí neo và lối đọc của
  // bảng quyết định ở scene "Chỉ khi rẻ" (ứng viên trái -> cổng -> ô đang giữ),
  // chỉ thêm hàng Prev bên dưới hàng Cost. Người xem gặp lại đúng khung quen.
  function drawPart3PrevUpdateBoard(node, { className = "", dx = 184, dy = -104 } = {}) {
    const point = nodes[node];
    const group = drawPart3GraphGroup(`part3-prev-update-board-visual ${className}`);
    const board = svg("g", {
      class: "part3-prev-update-board",
      transform: `translate(${point.x + dx} ${point.y + dy})`,
    });

    board.appendChild(svg("rect", { x: -160, y: -96, width: 320, height: 204, rx: 16, class: "part3-prev-panel-shell" }));
    const title = svg("text", { x: -136, y: -66, class: "part3-prev-board-title prev-board-title-accept" });
    title.textContent = `Khi nhận Cost[${node}]`;
    board.appendChild(title);
    const rejectTitle = svg("text", { x: -136, y: -66, class: "part3-prev-board-title prev-board-title-reject" });
    rejectTitle.textContent = `${node} đang giữ tốt nhất`;
    board.appendChild(rejectTitle);

    const rows = [
      { label: `Cost[${node}]`, empty: "trống", value: "6", y: -12, slot: "cost" },
      { label: `Prev[${node}]`, empty: "-", value: "E", y: 44, slot: "prev" },
    ];

    rows.forEach((row) => {
      const label = svg("text", { x: -136, y: row.y + 1, class: "part3-prev-board-label" });
      label.textContent = row.label;
      board.appendChild(label);

      const empty = svg("g", { class: `part3-prev-board-slot prev-${row.slot}-empty`, transform: `translate(96 ${row.y})` });
      empty.appendChild(svg("rect", { x: -44, y: -22, width: 88, height: 44, rx: 12, class: "part3-prev-board-slot-bg is-empty" }));
      const emptyText = svg("text", { x: 0, y: 1, class: "part3-prev-board-slot-text is-muted" });
      emptyText.textContent = row.empty;
      empty.appendChild(emptyText);
      board.appendChild(empty);

      const current = svg("g", { class: `part3-prev-board-slot prev-${row.slot}-current`, transform: `translate(96 ${row.y})` });
      current.appendChild(svg("rect", { x: -44, y: -22, width: 88, height: 44, rx: 12, class: `part3-prev-board-slot-bg is-${row.slot}` }));
      const currentText = svg("text", { x: 0, y: 1, class: "part3-prev-board-slot-text" });
      currentText.textContent = row.value;
      current.appendChild(currentText);
      board.appendChild(current);
    });

    // Đề xuất 7/D đứng hẳn bên trái, cách cổng một khoảng rõ ràng.
    const rejectCandidates = [
      { value: "7", y: -12, className: "prev-cost-reject-chip" },
      { value: "D", y: 44, className: "prev-prev-reject-chip" },
    ];
    rejectCandidates.forEach((candidate) => {
      const chip = svg("g", { class: `part3-prev-reject-chip ${candidate.className}`, transform: `translate(-44 ${candidate.y})` });
      chip.appendChild(svg("rect", { x: -28, y: -20, width: 56, height: 40, rx: 10, class: "part3-prev-reject-chip-bg" }));
      const chipText = svg("text", { x: 0, y: 1, class: "part3-prev-reject-chip-text" });
      chipText.textContent = candidate.value;
      chip.appendChild(chipText);
      board.appendChild(chip);
    });

    // Một cổng duy nhất chặn cả hai hàng: Cost và Prev cùng bị từ chối một nhịp.
    const rejectGate = svg("g", { class: "part3-prev-reject-gate prev-cost-reject-gate", transform: "translate(8 16)" });
    // Rect thay vì line: line dọc có bbox rộng 0 nên filter glow nuốt mất nó.
    rejectGate.appendChild(svg("rect", { x: -2.2, y: -56, width: 4.4, height: 112, rx: 2.2, class: "part3-prev-reject-gate-line" }));
    rejectGate.appendChild(svg("path", { d: "M -11 -11 L 11 11 M 11 -11 L -11 11", class: "part3-prev-reject-gate-x" }));
    board.appendChild(rejectGate);

    const lock = svg("g", { class: "part3-prev-board-lock prev-board-lock", transform: "translate(8 86)" });
    lock.appendChild(svg("rect", { x: -66, y: -14, width: 132, height: 28, rx: 9, class: "part3-prev-board-lock-bg" }));
    const lockText = svg("text", { x: 0, y: 1, class: "part3-prev-board-lock-text" });
    lockText.textContent = "không ghi 7/D";
    lock.appendChild(lockText);
    board.appendChild(lock);

    group.appendChild(board);
    return group;
  }

  function drawPart3UpdateBundle({ from, to, cost, parent, tone = "focus", className = "", offset = 0, startT = 0.16, endT = 0.84 }) {
    const startPoint = pointBetween(nodes[from], nodes[to], startT);
    const endPoint = pointBetween(nodes[from], nodes[to], endT);
    const normal = lineNormal(nodes[from], nodes[to]);
    const start = { x: startPoint.x + normal.x * offset, y: startPoint.y + normal.y * offset };
    const end = { x: endPoint.x + normal.x * offset, y: endPoint.y + normal.y * offset };
    const group = svg("g", {
      class: `part3-update-bundle is-${tone} ${className}`,
      transform: `translate(${start.x} ${start.y})`,
      "data-end-x": String(end.x),
      "data-end-y": String(end.y),
    });

    // Một viên duy nhất "cost · từ X": gói cost và cửa vào đi cùng nhau mà
    // không thành hai chip dính nhau, đỡ rối khi bay ngang các nhãn cạnh.
    const text = `${cost} · từ ${parent}`;
    const width = Math.max(84, text.length * 9 + 26);
    group.appendChild(svg("rect", { x: -width / 2, y: -17, width, height: 34, rx: 10, class: "part3-update-bundle-bg" }));
    const label = svg("text", { x: 0, y: 1, class: "part3-update-bundle-text" });
    label.textContent = text;
    group.appendChild(label);
    el.activeRouteLayer.appendChild(group);
    return group;
  }

  function drawPart3PrevBacktrackStrip({ className = "", x = 640, y = 570 } = {}) {
    const group = drawPart3GraphGroup(`part3-prev-backtrack-strip-visual ${className}`);
    const strip = svg("g", { class: "part3-prev-backtrack-strip", transform: `translate(${x} ${y})` });
    strip.appendChild(svg("rect", { x: -262, y: -38, width: 524, height: 76, rx: 15, class: "part3-prev-backtrack-strip-shell" }));

    const drawChip = (parent, node, chipX, chipClass = "") => {
      const chip = svg("g", { class: `part3-prev-chain-chip ${chipClass}`, transform: `translate(${chipX} 0)` });
      chip.appendChild(svg("rect", { x: -19, y: -19, width: 38, height: 38, rx: 10, class: "part3-prev-chain-chip-bg" }));
      const text = svg("text", { x: 0, y: 1, class: "part3-prev-chain-chip-text" });
      text.textContent = node;
      chip.appendChild(text);
      parent.appendChild(chip);
      return chip;
    };

    const drawLink = (parent, label, linkX, linkClass = "") => {
      const link = svg("text", { x: linkX, y: 1, class: `part3-prev-chain-link ${linkClass}` });
      link.textContent = label;
      parent.appendChild(link);
      return link;
    };

    const back = svg("g", { class: "part3-prev-chain-back" });
    const backNodes = ["K", "F", "E", "B", "C", "A"];
    backNodes.forEach((node, index) => {
      const chipX = -205 + index * 82;
      if (index > 0) drawLink(back, "<-", chipX - 41, `prev-chain-link-${node}`);
      drawChip(back, node, chipX, `prev-chain-node-${node}`);
    });
    strip.appendChild(back);

    const final = svg("g", { class: "part3-prev-chain-final" });
    const finalNodes = ["A", "C", "B", "E", "F", "K"];
    finalNodes.forEach((node, index) => {
      const chipX = -205 + index * 82;
      if (index > 0) drawLink(final, "->", chipX - 41);
      drawChip(final, node, chipX, "is-final");
    });
    strip.appendChild(final);

    group.appendChild(strip);
    return group;
  }

  function drawPart3EdgeTrace(route, { tone = "focus", className = "", offset = 0 } = {}) {
    const group = drawPart3GraphGroup(`part3-edge-trace-visual ${className}`);
    const path = svg("path", { d: routePath(route, offset), class: `part3-edge-trace-path is-${tone}` });
    group.appendChild(path);
    return group;
  }

  function drawPart3Gate(node, { className = "" } = {}) {
    const point = nodes[node];
    const group = drawPart3GraphGroup(`part3-gate-visual ${className}`);
    const gate = svg("g", { class: "part3-gate", transform: `translate(${point.x} ${point.y})` });
    gate.appendChild(svg("circle", { r: 42, class: "part3-gate-ring" }));
    gate.appendChild(svg("path", { d: "M -18 -4 C -6 12 10 12 22 -8", class: "part3-gate-lip" }));
    group.appendChild(gate);
    return group;
  }

  function drawPart3ParentArrow(child, parent, { className = "", text = "" } = {}) {
    const childPoint = nodes[child];
    const parentPoint = nodes[parent];
    const normal = lineNormal(childPoint, parentPoint);
    const path = routePath([child, parent], -18);
    const group = drawPart3GraphGroup(`part3-parent-arrow-visual ${className}`);
    const arrowPath = svg("path", { d: path, class: "part3-parent-arrow-path" });
    group.appendChild(arrowPath);

    const dx = parentPoint.x - childPoint.x;
    const dy = parentPoint.y - childPoint.y;
    const length = Math.hypot(dx, dy) || 1;
    const ux = dx / length;
    const uy = dy / length;
    const tip = { x: parentPoint.x - ux * 28, y: parentPoint.y - uy * 28 };
    const back = { x: tip.x - ux * 16, y: tip.y - uy * 16 };
    const wing = 7;
    group.appendChild(
      svg("path", {
        d: `M ${back.x + normal.x * wing} ${back.y + normal.y * wing} L ${tip.x} ${tip.y} L ${back.x - normal.x * wing} ${back.y - normal.y * wing}`,
        class: "part3-parent-arrow-head",
      }),
    );

    if (text) {
      const labelPoint = pointBetween(childPoint, parentPoint, 0.44);
      const width = Math.max(54, text.length * 10 + 18);
      const label = svg("g", {
        class: "part3-parent-label",
        transform: `translate(${labelPoint.x + normal.x * -34} ${labelPoint.y + normal.y * -34})`,
      });
      label.appendChild(svg("rect", { x: -width / 2, y: -13, width, height: 26, rx: 8, class: "part3-parent-label-bg" }));
      const labelText = svg("text", { x: 0, y: 1, class: "part3-parent-label-text" });
      labelText.textContent = text;
      label.appendChild(labelText);
      group.appendChild(label);
    }

    return group;
  }

  function drawPart3BacktrackCursor(startNode, className = "") {
    const point = nodes[startNode];
    const group = drawPart3GraphGroup(`part3-backtrack-cursor-visual ${className}`);
    const cursor = svg("g", { class: "part3-backtrack-cursor", transform: `translate(${point.x} ${point.y})` });
    cursor.appendChild(svg("circle", { r: 25, class: "part3-backtrack-cursor-ring" }));
    cursor.appendChild(svg("circle", { r: 8, class: "part3-backtrack-cursor-dot" }));
    group.appendChild(cursor);
    return cursor;
  }

  function animatePart3BacktrackCursor(tl, route, at = 1.8) {
    route.forEach((node, index) => {
      const point = nodes[node];
      const position = at + index * 0.16;
      tl.to(".part3-backtrack-cursor", { attr: { transform: `translate(${point.x} ${point.y})` }, duration: dur(0.14), ease: "power2.inOut" }, position);
      pulsePart3Nodes(tl, [node], position + 0.02, { toScale: index === 0 ? 1.12 : 1.08, duration: 0.18 });
    });
  }

  function animatePart3Packets(tl, selector, at = 0.56, duration = 0.55) {
    document.querySelectorAll(selector).forEach((packet, index) => {
      const dx = Number(packet.dataset.dx || 0);
      const dy = Number(packet.dataset.dy || 0);
      const startAt = at + index * 0.12;
      tl.fromTo(packet, { opacity: 0, scale: 0.76, transformOrigin: "center center" }, { opacity: 1, scale: 1, duration: dur(0.22), ease: "back.out(1.5)" }, startAt);
      tl.to(packet, { x: dx, y: dy, duration: dur(duration), ease: "power2.inOut" }, startAt + 0.08);
      tl.to(packet, { scale: 1.12, yoyo: true, repeat: 1, duration: dur(0.16), ease: "power2.inOut" }, startAt + duration + 0.1);
    });
  }

  function animatePart3FlowChips(tl, selector, at = 0.56, duration = 0.95) {
    document.querySelectorAll(selector).forEach((chip, index) => {
      const endX = Number(chip.dataset.endX || 0);
      const endY = Number(chip.dataset.endY || 0);
      const startAt = at + index * 0.12;
      tl.fromTo(chip, { opacity: 0, scale: 0.78, transformOrigin: "center center" }, { opacity: 1, scale: 1, duration: dur(0.24), ease: "back.out(1.4)", immediateRender: false }, startAt);
      tl.to(chip, { attr: { transform: `translate(${endX} ${endY})` }, duration: dur(duration), ease: "power2.inOut" }, startAt + 0.18);
      tl.to(chip, { scale: 1.08, yoyo: true, repeat: 1, duration: dur(0.18), ease: "power2.inOut" }, startAt + duration + 0.24);
    });
  }

  function drawPart3Backtrack(route, options = {}) {
    const group = drawPart3GraphGroup(`part3-backtrack-visual ${options.className || ""}`);
    const path = svg("path", { d: routePath(route, options.offset || -12), class: "part3-backtrack-path" });
    group.appendChild(path);
    const labelNode = options.labelNode || route[route.length - 1];
    const point = nodes[labelNode];
    const label = svg("g", { class: "part3-backtrack-label", transform: `translate(${point.x} ${point.y - 58})` });
    label.appendChild(svg("rect", { x: -48, y: -17, width: 96, height: 34, rx: 9, class: "part3-backtrack-label-bg" }));
    const text = svg("text", { x: 0, y: 1, class: "part3-backtrack-label-text" });
    text.textContent = options.text || "Prev";
    label.appendChild(text);
    group.appendChild(label);
    return group;
  }

  function enterPart3MinScene() {
    const tl = makeTimeline();
    const scanOrder = ["A", "C", "B", "D", "E"];
    const costs = { A: 0, C: 2, B: 4, D: 7, E: 6 };

    setCameraView(part3LoopCamera);
    setEdgeStates({ visible: [part2Edges.fromA], focus: [part2Edges.fromA] });
    setNodeStates(part2States.start, {
      focus: ["C", "B", "D", "E"],
      correct: ["A"],
      target: ["K"],
      showNodeCosts: true,
      nodeCostNodes: ["A", "C", "B", "D", "E"],
    });
    showMemoryPanel({
      cost: { A: 0, C: 2, B: 4, D: 7, E: 6 },
      focus: ["A"],
      amber: ["C", "B", "D", "E"],
    });
    drawPart3Probe("A", "min-probe");
    drawPart3MinHolder("A", { value: null, className: "min-holder" });
    drawPart3SettledTag("A", { className: "min-settled", label: "A đã chốt" });
    gsap.set(".min-holder, .min-probe", { opacity: 0 });
    gsap.set(".min-settled", { opacity: 0, transformOrigin: "center center" });
    showPart3Code("min", "Tìm đỉnh nhỏ nhất", "chờ viết");
    setMetrics("quét Cost", "giữ số bé nhất", "min = ?");

    animatePart3SceneIntro(tl, 0.16);
    moveCameraOnTimeline(tl, part2Cameras.frontier.center, part2Cameras.frontier.scale, 0.2, 0.62);
    tl.to(".min-holder, .min-probe", { opacity: 1, duration: dur(0.32), ease: "power2.out" }, 0.5);

    let t = 0.66;
    scanOrder.forEach((node, index) => {
      const point = nodes[node];
      const tagSel = `.min-tag-${node}`;
      tl.to(".part3-probe-cursor", { attr: { transform: `translate(${point.x} ${point.y})` }, duration: dur(0.16), ease: "power2.inOut" }, t);
      pulsePart3Nodes(tl, [node], t + 0.02, { toScale: 1.12, duration: 0.18 });
      if (index === 0) {
        moveMinHolder(tl, ".min-holder", node, costs[node], t + 0.12, { grab: true });
        drawPart3ScanTag(node, "nhận 0", { tone: "keep", className: "min-tag-A", dy: 54 });
        gsap.set(tagSel, { opacity: 0 });
        tl.fromTo(tagSel, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: dur(0.22), ease: "back.out(1.6)" }, t + 0.16);
        tl.call(() => setMetrics("đỉnh đầu tiên", "min = A · 0", "quét tiếp"), null, t + 0.16);
      } else {
        drawPart3ScanTag(node, `${costs[node]} > 0`, { tone: "lose", className: `min-tag-${node}`, dy: 54 });
        gsap.set(tagSel, { opacity: 0 });
        tl.fromTo(tagSel, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: dur(0.2), ease: "power2.out" }, t + 0.12);
        tl.call(() => setMetrics("so sánh", `${costs[node]} > 0`, "min vẫn A"), null, t + 0.12);
      }
      // Each verdict is transient so the final frame stays clean.
      tl.to(tagSel, { opacity: 0, duration: dur(0.18), ease: "power2.in" }, t + 0.38);
      t += 0.44;
    });

    // A=0 wins the whole scan — but A was already settled. The holder flips to a
    // warning tone and the soft "đã chốt" tag exposes the bug that motivates
    // Visited, replacing the old red ✗ slam.
    tl.to(".min-probe", { opacity: 0, duration: dur(0.26), ease: "power2.in" }, t);
    tl.call(() => {
      const card = document.querySelector(".min-holder .part3-min-holder");
      if (card) card.classList.add("is-warn");
    }, null, t + 0.04);
    tl.call(() => setMetrics("A = 0 thắng lại", "nhưng A đã chốt", "cần Visited"), null, t + 0.06);
    tl.to(".node-A", { opacity: 0.6, duration: dur(0.3) }, t + 0.06);
    tl.fromTo(".min-settled", { opacity: 0, scale: 0.82, y: 6 }, { opacity: 1, scale: 1, y: 0, duration: dur(0.34), ease: "back.out(1.5)" }, t + 0.08);
    pulsePart3Nodes(tl, ["A"], t + 0.14, { toScale: 1.1, duration: 0.28 });
    return tl;
  }

  function enterPart3VisitedScene() {
    const tl = makeTimeline();
    const scanOrder = ["A", "B", "C", "D", "E"];
    const costs = { A: 0, C: 2, B: 4, D: 7, E: 6 };
    const visitedCamera = { center: { x: 296, y: 346 }, scale: 1.22 };

    setCameraView(visitedCamera);
    setEdgeStates({ visible: [part2Edges.fromA], focus: [[["A", "C"]]] });
    setNodeStates(part2States.start, {
      focus: ["C", "B", "D", "E"],
      correct: ["A"],
      target: ["K"],
      showNodeCosts: true,
      nodeCostNodes: ["A", "C", "B", "D", "E"],
    });
    showMemoryPanel({
      cost: { A: 0, C: 2, B: 4, D: 7, E: 6 },
      visited: ["A"],
      focus: ["C"],
      amber: ["B", "D", "E"],
    });
    drawPart3Probe("A", "visited-probe");
    drawPart3MinHolder("B", { value: null, className: "visited-holder" });
    drawPart3SettledTag("A", { className: "visited-settled", label: "A đã chốt" });
    gsap.set(".visited-holder, .visited-probe", { opacity: 0 });
    gsap.set(".visited-settled", { opacity: 0, transformOrigin: "center center" });
    showPart3Code("visited", "Loại đỉnh đã chốt", "chờ sửa");
    setMetrics("Visited chặn", "bỏ đỉnh đã chốt", "min = ?");

    animatePart3SceneIntro(tl, 0.16);
    tl.to(".visited-probe", { opacity: 1, duration: dur(0.3), ease: "power2.out" }, 0.4);

    let t = 0.54;
    scanOrder.forEach((node) => {
      const point = nodes[node];
      tl.to(".part3-probe-cursor", { attr: { transform: `translate(${point.x} ${point.y})` }, duration: dur(0.16), ease: "power2.inOut" }, t);
      pulsePart3Nodes(tl, [node], t + 0.02, { toScale: 1.1, duration: 0.16 });
      if (node === "A") {
        // Gate: A is in Visited, so the scan steps over it without it ever
        // becoming a candidate.
        tl.fromTo(".visited-settled", { opacity: 0, scale: 0.82, y: 6 }, { opacity: 1, scale: 1, y: 0, duration: dur(0.3), ease: "back.out(1.5)" }, t + 0.08);
        tl.to(".node-A", { opacity: 0.6, duration: dur(0.24) }, t + 0.08);
        drawPart3ScanTag(node, "bỏ qua", { tone: "lose", className: "visited-tag-A", dy: 52 });
        gsap.set(".visited-tag-A", { opacity: 0 });
        tl.fromTo(".visited-tag-A", { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: dur(0.22), ease: "power2.out" }, t + 0.14);
        tl.call(() => setMetrics("gặp A", "Visited[A] = đúng", "bỏ qua"), null, t + 0.12);
      } else if (node === "B") {
        // First eligible vertex becomes the provisional champion.
        tl.to(".visited-holder", { opacity: 1, duration: dur(0.26), ease: "power2.out" }, t + 0.08);
        moveMinHolder(tl, ".visited-holder", node, costs[node], t + 0.12, { grab: true });
        drawPart3ScanTag(node, "nhận 4", { tone: "keep", className: "visited-tag-B", dy: 52 });
        gsap.set(".visited-tag-B", { opacity: 0 });
        tl.fromTo(".visited-tag-B", { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: dur(0.24), ease: "back.out(1.6)" }, t + 0.16);
        tl.call(() => setMetrics("đỉnh mở đầu", "min = B", "cost 4"), null, t + 0.16);
      } else if (node === "C") {
        // C beats the held value, so the token jumps from B to C.
        moveMinHolder(tl, ".visited-holder", node, costs[node], t + 0.12, { grab: true });
        drawPart3ScanTag(node, "2 < 4 · giữ", { tone: "keep", className: "visited-tag-C", dy: 54 });
        gsap.set(".visited-tag-C", { opacity: 0 });
        tl.fromTo(".visited-tag-C", { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: dur(0.24), ease: "back.out(1.6)" }, t + 0.16);
        tl.call(() => setMetrics("2 < 4", "min nhảy sang C", "min = C"), null, t + 0.16);
      } else {
        drawPart3ScanTag(node, `${costs[node]} > 2`, { tone: "lose", className: `visited-tag-${node}`, dy: 54 });
        gsap.set(`.visited-tag-${node}`, { opacity: 0 });
        tl.fromTo(`.visited-tag-${node}`, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: dur(0.22), ease: "power2.out" }, t + 0.12);
        tl.call(() => setMetrics("so sánh", `${costs[node]} > 2`, "min vẫn C"), null, t + 0.12);
      }
      // Verdicts are transient; A keeps only its standing "đã chốt" pill.
      tl.to(`.visited-tag-${node}`, { opacity: 0, duration: dur(0.18), ease: "power2.in" }, t + 0.4);
      t += 0.44;
    });

    tl.to(".visited-probe", { opacity: 0, duration: dur(0.26), ease: "power2.in" }, t);
    tl.call(() => setMetrics("quét xong", "min = C · 2", "C nhỏ nhất"), null, t + 0.04);
    pulsePart3Nodes(tl, ["C"], t + 0.08, { toScale: 1.14, duration: 0.3 });
    return tl;
  }

  function enterPart3EmptyScene() {
    const tl = makeTimeline();

    setCameraView(part2Cameras.frontier);
    setEdgeStates({ visible: [part2Edges.fromA, part2Edges.fromC, part2Edges.fromB, part2Edges.fromE, part2Edges.fromD] });
    setNodeStates(part3NoFrontierState, {
      focus: ["A", "C", "B", "E", "D", "F", "G"],
      correct: ["A", "C", "B", "E", "D", "F", "G"],
      showNodeCosts: true,
      nodeCostNodes: ["A", "C", "B", "E", "D", "F", "G"],
    });
    const closedNodes = ["A", "C", "B", "E", "D", "F", "G"];
    closedNodes.forEach((node) => {
      drawPart3SettledTag(node, { className: "empty-settled-tag", compact: true, dy: -42 });
    });
    gsap.set(".empty-settled-tag", { opacity: 0, transformOrigin: "center center" });
    showMemoryPanel({
      cost: { A: 0, C: 2, B: 3, E: 4, D: 5, F: 6, G: 9 },
      visited: ["A", "C", "B", "E", "D", "F", "G"],
      focus: ["A", "C", "B", "E", "D", "F", "G"],
    });
    showPart3Code("empty", "Sửa dòng chốt hết", "chờ sửa");
    setMetrics("quét xong", "min = null", "break");

    animatePart3SceneIntro(tl, 0.16);
    moveCameraOnTimeline(tl, part3GuardCamera.center, part3GuardCamera.scale, 0.2, 0.58);
    tl.to(closedNodes.map((node) => `.node-${node}`).join(", "), { opacity: 0.55, duration: dur(0.4), ease: "power2.out" }, 0.4);
    tl.fromTo(".empty-settled-tag", { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, stagger: dur(0.06), duration: dur(0.3), ease: "back.out(1.7)" }, 0.46);
    tl.call(() => setMetrics("hết đỉnh mở", "không còn ứng viên", "cần break"), null, 0.9);
    return tl;
  }

  function enterPart3EndScene() {
    const tl = makeTimeline();
    const finalEdges = [
      ["A", "C"],
      ["C", "B"],
      ["B", "E"],
      ["E", "F"],
      ["F", "K"],
    ];

    setCameraView(part3GuardCamera);
    setEdgeStates({ visible: part3AllEdges, context: [part3AllEdges] });
    setNodeStates(part3EndReadyState, { focus: ["K"], target: ["K"], showNodeCosts: true });
    drawPart3Probe("K", "end-probe");
    drawPart3NodeMarker("K", { tone: "focus", symbol: "check", className: "end-target-marker" });
    showMemoryPanel({
      cost: { A: 0, C: 2, B: 3, E: 4, D: 5, F: 6, G: 9, K: 10 },
      visited: ["A", "C", "B", "E", "D", "F", "G"],
      focus: ["K"],
    });
    showPart3Code("end", "Sửa dòng gặp đích", "chờ sửa");
    setMetrics("nhánh thật", "min = K", "dừng");

    animatePart3SceneIntro(tl, 0.14);
    moveCameraOnTimeline(tl, part2Cameras.full.center, part2Cameras.full.scale, 0.16, 0.72);
    tl.call(() => {
      setEdgeStates({ visible: part3AllEdges, locked: [finalEdges], focus: [[["F", "K"]]] });
      setNodeStates(part3EndReadyState, { focus: ["K"], target: ["K"], showNodeCosts: true });
      showBestRoute(part2FinalPath);
      setMetrics("K là min", "Cost[K] = 10", "khỏi mở tiếp");
    }, null, 0.62);
    pulsePart3Nodes(tl, ["K"], 0.78, { toScale: 1.15, duration: 0.32 });
    return tl;
  }

  function enterPart3SettleScene() {
    const tl = makeTimeline();

    setCameraView(part2Cameras.full);
    setEdgeStates({ visible: [part2Edges.fromA], focus: [[["A", "C"]]] });
    setNodeStates(part2States.start, {
      focus: ["C"],
      correct: ["A"],
      target: ["K"],
      showNodeCosts: true,
      nodeCostNodes: ["A", "C", "B", "D", "E"],
    });
    showMemoryPanel({
      cost: { A: 0, C: 2, B: 4, D: 7, E: 6 },
      visited: ["A"],
      focus: ["C"],
    });
    drawPart3Probe("C", "settle-probe");
    drawPart3NodeMarker("C", { tone: "focus", symbol: "check", className: "settle-marker" });
    showPart3Code("settle", "Đánh dấu đã chốt", "chờ viết");
    setMetrics("min = C", "C != K", "Visited[C]");

    animatePart3SceneIntro(tl, 0.16);
    moveCameraOnTimeline(tl, part2Cameras.frontier.center, part2Cameras.frontier.scale, 0.16, 0.64);
    pulsePart3Nodes(tl, ["C"], 0.42, { toScale: 1.14, duration: 0.3 });
    tl.call(() => {
      setNodeStates(part3AfterCSettledState, {
        focus: ["C"],
        correct: ["A", "C"],
        target: ["K"],
        showNodeCosts: true,
        nodeCostNodes: ["A", "C", "B", "D", "E"],
      });
      showMemoryPanel({
        cost: { A: 0, C: 2, B: 4, D: 7, E: 6 },
        visited: ["A", "C"],
        focus: ["C"],
      });
      setMetrics("C đã chắc", "ra khỏi vùng mở", "mở cạnh C");
    }, null, 0.78);
    pulsePart3Nodes(tl, ["C"], 0.84, { toScale: 1.1, duration: 0.26 });
    return tl;
  }

  function enterPart3RelaxNaiveScene() {
    const tl = makeTimeline();

    setCameraView(part2Cameras.frontier);
    setEdgeStates({ visible: [part2Edges.fromA], locked: [[["A", "C"]]], context: [[["A", "B"], ["A", "D"], ["A", "E"]]] });
    setNodeStates(part3AfterCSettledState, {
      focus: ["C", "B", "D"],
      correct: ["A", "C"],
      target: ["K"],
      showNodeCosts: true,
      nodeCostNodes: ["A", "C", "B", "D", "E"],
    });
    drawCandidateRoutes([
      ["C", "B"],
      ["C", "D"],
    ]);
    drawPart3Packet({ from: "C", to: "B", text: "2+1=3", tone: "focus", className: "relax-packet packet-B", offset: -54 });
    drawPart3Packet({ from: "C", to: "D", text: "2+3=5", tone: "focus", className: "relax-packet packet-D", offset: -70 });
    showMemoryPanel({
      cost: { A: 0, C: 2, B: 4, D: 7, E: 6 },
      visited: ["A", "C"],
      focus: ["C"],
      amber: ["B", "D"],
    });
    showPart3Code("relaxNaive", "Gán cost mới", "chờ viết");
    setMetrics("min = C", "C -> B/D", "mở kề");

    gsap.set(".route-candidate, .part3-packet", { opacity: 0 });
    animatePart3SceneIntro(tl, 0.18);
    tl.call(() => {
      setEdgeStates({ visible: [part2Edges.fromA, part2Edges.fromC], focus: [part2Edges.fromC], locked: [[["A", "C"]]] });
      setMetrics("for canh", "C -> B/D", "tính newCost");
    }, null, 0.42);
    tl.fromTo(".route-candidate", { opacity: 0, strokeDashoffset: 58 }, { opacity: 0.68, strokeDashoffset: 0, stagger: dur(0.08), duration: dur(0.44), ease: "power2.out" }, 0.46);
    animatePart3Packets(tl, ".relax-packet", 0.62, 0.52);
    pulsePart3Nodes(tl, ["B", "D"], 1.12, { toScale: 1.1, stagger: 0.08 });
    tl.call(() => {
      setNodeStates(part2States.afterC, {
        focus: ["B", "D"],
        correct: ["A", "C"],
        target: ["K"],
        showNodeCosts: true,
        nodeCostNodes: ["A", "C", "B", "D", "E"],
      });
      showMemoryPanel({
        cost: { A: 0, C: 2, B: 3, D: 5, E: 6 },
        visited: ["A", "C"],
        focus: ["B", "D"],
        amber: ["B", "D"],
      });
      setMetrics("Cost cập nhật", "B=3, D=5", "bản gán thô");
    }, null, 1.12);
    return tl;
  }

  function enterPart3RelaxGuardScene() {
    const tl = makeTimeline();
    const visible = [part2Edges.fromA, part2Edges.fromC, part2Edges.fromB, part2Edges.fromE, part2Edges.fromD];
    const lockedBeforeF = [
      ["A", "C"],
      ["C", "B"],
      ["B", "E"],
    ];
    const lockedWithF = [...lockedBeforeF, ["E", "F"]];
    const beforeFState = makePart2State({
      A: ["settled", 0, "-"],
      C: ["settled", 2, "A"],
      B: ["settled", 3, "C"],
      D: ["open", 5, "C"],
      E: ["settled", 4, "B"],
      F: ["unknown", null, "-"],
      G: ["open", 9, "E"],
      K: ["unknown", null, "-"],
    });
    const currentFState = makePart2State({
      A: ["settled", 0, "-"],
      C: ["settled", 2, "A"],
      B: ["settled", 3, "C"],
      D: ["open", 5, "C"],
      E: ["settled", 4, "B"],
      F: ["open", 6, "E"],
      G: ["open", 9, "E"],
      K: ["unknown", null, "-"],
    });
    const testingFromDState = makePart2State({
      A: ["settled", 0, "-"],
      C: ["settled", 2, "A"],
      B: ["settled", 3, "C"],
      D: ["settled", 5, "C"],
      E: ["settled", 4, "B"],
      F: ["open", 6, "E"],
      G: ["open", 9, "E"],
      K: ["unknown", null, "-"],
    });
    const overwrittenState = makePart2State({
      A: ["settled", 0, "-"],
      C: ["settled", 2, "A"],
      B: ["settled", 3, "C"],
      D: ["settled", 5, "C"],
      E: ["settled", 4, "B"],
      F: ["open", 7, "D"],
      G: ["open", 9, "E"],
      K: ["unknown", null, "-"],
    });
    const bestToF = ["A", "C", "B", "E", "F"];
    let manualIndex = 0;

    function setGuardCopy(body, metrics) {
      el.sceneBody.textContent = body;
      setMetrics(metrics[0], metrics[1], metrics[2]);
    }

    function startGuardStep() {
      const stepTl = makeTimeline();
      activeTimeline = stepTl;
      updatePauseButton();
      return stepTl;
    }

    function setGuardCurrentSlot(value, overwritten = false) {
      const slot = document.querySelector(".guard-slot-current");
      if (!slot) return;
      slot.classList.toggle("is-overwritten", overwritten);
      const valueLabel = slot.querySelector(".part3-guard-value");
      if (valueLabel) valueLabel.textContent = value;
    }

    function setGuardChipTranslate(selector, x, y) {
      const chip = document.querySelector(selector);
      if (!chip) return;
      const safeX = Math.round(x * 1000) / 1000;
      const safeY = Math.round(y * 1000) / 1000;
      chip.setAttribute("transform", `translate(${safeX} ${safeY})`);
    }

    function animateGuardChipTranslate(timeline, selector, from, to, at, duration, ease) {
      const position = { x: from.x, y: from.y };
      timeline.call(() => setGuardChipTranslate(selector, from.x, from.y), null, at);
      timeline.to(
        position,
        {
          x: to.x,
          y: to.y,
          duration: dur(duration),
          ease,
          onUpdate: () => setGuardChipTranslate(selector, position.x, position.y),
        },
        at,
      );
    }

    function queueNextGuardStep() {
      prepareVisualAdvance(manualIndex < guardSteps.length ? runNextGuardStep : null);
    }

    function runNextGuardStep() {
      const step = guardSteps[manualIndex];
      manualIndex += 1;
      visualAdvanceBlocked = true;
      updateControlAvailability();
      const stepTl = step();
      if (stepTl && typeof stepTl.call === "function") {
        stepTl.call(queueNextGuardStep, null, ">");
      } else {
        queueNextGuardStep();
      }
    }

    const guardSteps = [
      () => {
        const stepTl = startGuardStep();
        setEdgeStates({ visible, focus: [[["E", "F"]]], locked: [lockedBeforeF], context: [part3AllEdges] });
        setNodeStates(beforeFState, { focus: ["E", "F"], correct: ["A", "C", "B", "E"], showNodeCosts: true });
        showMemoryPanel({ cost: { F: "-" }, visited: ["E"], focus: ["F"] });
        setGuardCopy("Đầu tiên, nếu Cost[F] còn trống, số đầu tiên tìm được có quyền mở ô đó. E tạo ứng viên 4 + 2 = 6, nên F nhận 6.", ["ô trống", "6", "nhận"]);
        // Chip 6 hiện ở cửa vào bên trái rồi trượt một mạch sang ô bên phải.
        stepTl.call(() => setGuardChipTranslate(".guard-candidate-six", GUARD_CHIP_HOME.x, GUARD_CHIP_HOME.y), null, 0);
        stepTl.fromTo(".guard-candidate-six", { opacity: 0, scale: 0.76 }, { opacity: 1, scale: 1, duration: dur(0.3), ease: "back.out(1.4)" }, 0.04);
        animateGuardChipTranslate(stepTl, ".guard-candidate-six", GUARD_CHIP_HOME, GUARD_SLOT_POS, 0.52, 0.62, "power2.inOut");
        stepTl.to(".guard-slot-empty", { opacity: 0, scale: 0.82, duration: dur(0.2), ease: "power2.in" }, 1.0);
        stepTl.fromTo(".guard-slot-current", { opacity: 0, scale: 0.82 }, { opacity: 1, scale: 1, duration: dur(0.3), ease: "back.out(1.35)" }, 1.1);
        // Ô đã nhận số thì chip biến mất — chỉ còn một hình duy nhất giữ số 6.
        stepTl.to(".guard-candidate-six", { opacity: 0, duration: dur(0.22), ease: "power2.in" }, 1.18);
        stepTl.call(() => {
          setNodeStates(currentFState, { focus: ["F"], correct: ["A", "C", "B", "E"], showNodeCosts: true });
          showMemoryPanel({ cost: { F: 6 }, visited: ["E"], focus: ["F"] });
          showBestRoute(bestToF);
        }, null, 1.24);
        pulsePart3Nodes(stepTl, ["F"], 1.34, { toScale: 1.12, duration: 0.28 });
        return stepTl;
      },
      () => {
        const stepTl = startGuardStep();
        setEdgeStates({ visible, focus: [[["D", "F"]]], locked: [lockedWithF], context: [part3AllEdges] });
        setNodeStates(testingFromDState, { focus: ["D", "F"], correct: ["A", "C", "B", "E"], showNodeCosts: true });
        showMemoryPanel({ cost: { F: 6 }, visited: ["D"], focus: ["F"], amber: ["D"] });
        setGuardCopy("Sau đó D cũng đi tới F và tạo ứng viên 5 + 2 = 7. Vấn đề là F không còn trống nữa: trong ô đã có 6.", ["D -> F", "7", "đã có 6"]);
        stepTl.fromTo(".guard-edge-seven", { opacity: 0 }, { opacity: 0.72, duration: dur(0.26), ease: "power2.out" }, 0);
        stepTl.to(".guard-edge-seven .part3-edge-trace-path", { strokeDashoffset: 0, duration: dur(0.52), ease: "power2.out" }, 0.06);
        stepTl.call(() => setGuardChipTranslate(".guard-candidate-seven", GUARD_CHIP_HOME.x, GUARD_CHIP_HOME.y), null, 0.3);
        stepTl.fromTo(".guard-candidate-seven", { opacity: 0, scale: 0.76 }, { opacity: 1, scale: 1, duration: dur(0.28), ease: "back.out(1.4)" }, 0.4);
        stepTl.fromTo(".guard-slot-current", { scale: 0.96 }, { scale: 1.08, yoyo: true, repeat: 1, duration: dur(0.22), ease: "power2.inOut" }, 0.74);
        pulsePart3Nodes(stepTl, ["F"], 0.88, { toScale: 1.1, duration: 0.28 });
        return stepTl;
      },
      () => {
        const stepTl = startGuardStep();
        setGuardCopy("Nếu dòng code vẫn gán thẳng Cost[F] = newCost, ứng viên 7 sẽ ghi đè lên 6. Ta vừa làm mất đường tốt hơn đã tìm được trước đó.", ["gán bừa", "7 ghi vào", "mất 6"]);
        stepTl.to(".route-best", { opacity: 0.18, duration: dur(0.28), ease: "power2.inOut" }, 0);
        animateGuardChipTranslate(stepTl, ".guard-candidate-seven", GUARD_CHIP_HOME, GUARD_SLOT_POS, 0.12, 0.66, "power3.inOut");
        // 7 đè vào ô: ô lật sang đỏ, chip ẩn đi, lời nhắc "6 bị mất" nằm ngay dưới ô.
        stepTl.call(() => setGuardCurrentSlot("7", true), null, 0.8);
        stepTl.to(".guard-candidate-seven", { opacity: 0, duration: dur(0.16), ease: "power2.in" }, 0.8);
        stepTl.fromTo(".guard-slot-current", { scale: 0.94 }, { scale: 1.06, yoyo: true, repeat: 1, duration: dur(0.24), ease: "power2.inOut" }, 0.84);
        stepTl.fromTo(".guard-lost", { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: dur(0.26), ease: "back.out(1.4)" }, 0.98);
        stepTl.call(() => {
          setNodeStates(overwrittenState, { focus: ["F"], wrong: ["F"], showNodeCosts: true });
          showMemoryPanel({ cost: { F: 7 }, visited: ["D"], danger: ["F"], amber: ["D"] });
        }, null, 1.08);
        pulsePart3Nodes(stepTl, ["F"], 1.18, { toScale: 1.16, duration: 0.32 });
        return stepTl;
      },
      () => {
        const stepTl = startGuardStep();
        setGuardCopy("Vậy trước khi ghi, ta phải hỏi: ô chưa mở, hoặc số mới có rẻ hơn số đang giữ không? Ở đây 7 không nhỏ hơn 6, nên 7 bị chặn và Cost[F] vẫn là 6.", ["so sánh", "7 < 6 ?", "giữ 6"]);
        stepTl.call(() => {
          setGuardCurrentSlot("6", false);
          setNodeStates(testingFromDState, { focus: ["D", "F"], correct: ["A", "C", "B", "E"], showNodeCosts: true });
          showMemoryPanel({ cost: { F: 6 }, visited: ["D"], focus: ["F"], amber: ["D"] });
          showBestRoute(bestToF);
          setGuardChipTranslate(".guard-candidate-seven", GUARD_CHIP_HOME.x, GUARD_CHIP_HOME.y);
        }, null, 0);
        stepTl.to(".guard-lost", { opacity: 0, duration: dur(0.2), ease: "power2.in" }, 0);
        stepTl.fromTo(".guard-slot-current", { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: dur(0.3), ease: "back.out(1.35)" }, 0.06);
        stepTl.fromTo(".guard-candidate-seven", { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: dur(0.26), ease: "back.out(1.4)" }, 0.24);
        // Lần này giữa đường có cổng so sánh: câu hỏi treo phía trên, thanh chặn đứng giữa.
        stepTl.fromTo(".guard-compare", { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: dur(0.28), ease: "back.out(1.4)" }, 0.5);
        stepTl.fromTo(".guard-gate", { opacity: 0, scaleY: 0.6, transformOrigin: "center center" }, { opacity: 1, scaleY: 1, duration: dur(0.28), ease: "back.out(1.4)" }, 0.66);
        // 7 lao tới cổng, bị bật ngược lại, dấu X nhấn đúng khoảnh khắc va chạm.
        animateGuardChipTranslate(stepTl, ".guard-candidate-seven", GUARD_CHIP_HOME, { x: -44, y: GUARD_CHIP_HOME.y }, 0.92, 0.38, "power2.in");
        animateGuardChipTranslate(stepTl, ".guard-candidate-seven", { x: -44, y: GUARD_CHIP_HOME.y }, GUARD_CHIP_HOME, 1.3, 0.34, "back.out(1.8)");
        stepTl.fromTo(".guard-gate .part3-guard-gate-x", { opacity: 0, scale: 0.6, transformOrigin: "center center" }, { opacity: 1, scale: 1, duration: dur(0.22), ease: "back.out(2)" }, 1.28);
        stepTl.fromTo(".guard-reject", { opacity: 0, scale: 0.82 }, { opacity: 1, scale: 1, duration: dur(0.26), ease: "back.out(1.4)" }, 1.46);
        stepTl.fromTo(".guard-slot-current", { scale: 0.96 }, { scale: 1.07, yoyo: true, repeat: 1, duration: dur(0.24), ease: "power2.inOut" }, 1.56);
        pulsePart3Nodes(stepTl, ["F"], 1.64, { toScale: 1.13, duration: 0.32 });
        return stepTl;
      },
      () => {
        const stepTl = startGuardStep();
        setGuardCopy("Sau khi bản chất đã rõ, dòng gán Cost[ke] không được đứng một mình nữa. Nó phải nằm trong điều kiện: chưa có cost, hoặc newCost nhỏ hơn cost hiện tại.", ["đổi code", "if", "chỉ ghi khi rẻ"]);
        // Dọn bảng trước khi mở lại panel code để hai lớp không đè nhau.
        stepTl.to(".guard-decision-board, .guard-edge-six, .guard-edge-seven", { opacity: 0, duration: dur(0.3), ease: "power2.in" }, 0);
        stepTl.call(() => {
          el.stageShell.classList.remove("is-visual-proof");
          setCameraView({ center: { x: 476, y: 352 }, scale: 0.96 });
          showPart3Code("relaxGuard", "Không ghi đè đường tốt", "chờ sửa");
          setCodeActiveLines([20]);
        }, null, 0.36);
        return stepTl;
      },
    ];

    setCameraView(part3CostSlotCamera);
    setEdgeStates({ visible, focus: [[["E", "F"]]], locked: [lockedBeforeF], context: [part3AllEdges] });
    setNodeStates(beforeFState, { focus: ["E", "F"], correct: ["A", "C", "B", "E"], showNodeCosts: true });
    showMemoryPanel({ cost: { F: "-" }, visited: ["E"], focus: ["F"] });
    drawPart3EdgeTrace(["E", "F"], { tone: "focus", className: "guard-edge-six", offset: -18 });
    drawPart3EdgeTrace(["D", "F"], { tone: "warn", className: "guard-edge-seven", offset: 18 });
    drawPart3GuardDecisionBoard("F", { className: "guard-decision-board" });
    el.stageShell.classList.add("is-visual-proof");
    hideCodePanel();
    setGuardCopy("Ta zoom vào đúng khoảnh khắc cập nhật Cost[F]. Lúc đầu ô này chưa có số, nên hãy xem số đầu tiên đi vào ô như thế nào.", ["Cost[F]", "trống", "bấm Tiếp"]);
    queueNextGuardStep();

    gsap.set(".guard-edge-six, .guard-edge-seven", { opacity: 0 });
    gsap.set(".guard-candidate-six, .guard-candidate-seven, .guard-slot-current, .guard-compare, .guard-gate, .guard-reject, .guard-lost", {
      opacity: 0,
      transformOrigin: "center center",
    });
    gsap.set(".guard-gate .part3-guard-gate-x", { opacity: 0 });
    prepareSvgPathDraw(".guard-edge-six .part3-edge-trace-path, .guard-edge-seven .part3-edge-trace-path");
    animatePart3SceneIntro(tl, 0.16);
    moveCameraOnTimeline(tl, part3CostSlotCamera.center, part3CostSlotCamera.scale, 0.2, 0.68);
    tl.fromTo(".guard-decision-board", { opacity: 0, scale: 0.9, transformOrigin: "center center" }, { opacity: 1, scale: 1, duration: dur(0.44), ease: "back.out(1.35)" }, 0.52);
    tl.fromTo(".guard-edge-six", { opacity: 0 }, { opacity: 0.72, duration: dur(0.28), ease: "power2.out" }, 0.72);
    tl.to(".guard-edge-six .part3-edge-trace-path", { strokeDashoffset: 0, duration: dur(0.64), ease: "power2.out" }, 0.78);
    return tl;
  }

  function enterPart3PrevScene() {
    const tl = makeTimeline();
    const beforeFState = makePart2State({
      A: ["settled", 0, "-"],
      C: ["settled", 2, "A"],
      B: ["settled", 3, "C"],
      D: ["open", 5, "C"],
      E: ["settled", 4, "B"],
      F: ["unknown", null, "-"],
      G: ["unknown", null, "-"],
      K: ["unknown", null, "-"],
    });
    const afterFOnlyState = makePart2State({
      A: ["settled", 0, "-"],
      C: ["settled", 2, "A"],
      B: ["settled", 3, "C"],
      D: ["open", 5, "C"],
      E: ["settled", 4, "B"],
      F: ["open", 6, "E"],
      G: ["unknown", null, "-"],
      K: ["unknown", null, "-"],
    });
    const finalWithKState = part3EndReadyState;
    const finalEdges = [
      ["A", "C"],
      ["C", "B"],
      ["B", "E"],
      ["E", "F"],
      ["F", "K"],
    ];
    const visibleBeforeF = [part2Edges.fromA, part2Edges.fromC, part2Edges.fromB, part2Edges.fromE, part2Edges.fromD];
    const lockedToE = [
      ["A", "C"],
      ["C", "B"],
      ["B", "E"],
    ];
    let manualIndex = 0;

    function setPrevCopy(body, metrics) {
      el.sceneBody.textContent = body;
      setMetrics(metrics[0], metrics[1], metrics[2]);
    }

    function startPrevStep() {
      const stepTl = makeTimeline();
      activeTimeline = stepTl;
      updatePauseButton();
      return stepTl;
    }

    function queueNextPrevStep() {
      prepareVisualAdvance(manualIndex < prevSteps.length ? runNextPrevStep : null);
    }

    function runNextPrevStep() {
      const step = prevSteps[manualIndex];
      manualIndex += 1;
      visualAdvanceBlocked = true;
      updateControlAvailability();
      const stepTl = step();
      if (stepTl && typeof stepTl.call === "function") {
        stepTl.call(queueNextPrevStep, null, ">");
      } else {
        queueNextPrevStep();
      }
    }

    const prevSteps = [
      () => {
        const stepTl = startPrevStep();
        setPrevCopy("Giả sử cuối cùng ta biết Cost[K] = 10. Con số này trả lời tốn bao nhiêu, nhưng nếu đứng ở K thì ta chưa biết phải quay về đỉnh nào để dựng lại đường.", ["Cost[K]", "10", "chưa biết đường"]);
        stepTl.fromTo(".prev-question-marker", { opacity: 0, scale: 0.72, transformOrigin: "center center" }, { opacity: 1, scale: 1, duration: dur(0.28), ease: "back.out(1.5)" }, 0.06);
        stepTl.fromTo(".prev-backtrack-cursor-shell", { opacity: 0, scale: 0.84, transformOrigin: "center center" }, { opacity: 1, scale: 1, duration: dur(0.34), ease: "back.out(1.35)" }, 0.22);
        stepTl.fromTo(".part3-backtrack-cursor", { scale: 0.9 }, { scale: 1.12, yoyo: true, repeat: 3, duration: dur(0.18), ease: "power2.inOut" }, 0.62);
        pulsePart3Nodes(stepTl, ["K"], 0.66, { toScale: 1.12, duration: 0.3 });
        return stepTl;
      },
      () => {
        const stepTl = startPrevStep();
        setPrevCopy("Cách dễ nghĩ nhất là lưu luôn cả đường đi tới từng đỉnh. Cách này đúng, nhưng các đường sau copy lại rất nhiều đoạn đầu.", ["lưu Path", "bị lặp", "hơi thừa"]);
        stepTl.to(".prev-question-marker", { opacity: 0, scale: 0.82, duration: dur(0.18), ease: "power2.in" }, 0);
        stepTl.fromTo(".prev-path-panel", { opacity: 0, scale: 0.9, transformOrigin: "center center" }, { opacity: 1, scale: 1, duration: dur(0.38), ease: "back.out(1.3)" }, 0.08);
        stepTl.fromTo(".prev-route-f, .prev-route-k", { opacity: 0 }, { opacity: 0.58, stagger: dur(0.08), duration: dur(0.24), ease: "power2.out" }, 0.22);
        stepTl.to(".prev-route-f .part3-edge-trace-path, .prev-route-k .part3-edge-trace-path", { strokeDashoffset: 0, stagger: dur(0.08), duration: dur(0.62), ease: "power2.out" }, 0.28);
        stepTl.fromTo(".part3-prev-duplicate-mark", { opacity: 0 }, { opacity: 1, duration: dur(0.3), ease: "power2.out" }, 0.8);
        return stepTl;
      },
      () => {
        const stepTl = startPrevStep();
        setPrevCopy("Ta không cần lưu nguyên cả chuỗi. Mỗi đỉnh chỉ cần nhớ một cửa vào: muốn tới K thì trước đó là F, muốn tới F thì trước đó là E.", ["nén Path", "Prev[K]=F", "Prev[F]=E"]);
        stepTl.to(".prev-path-panel", { opacity: 0.18, scale: 0.96, duration: dur(0.36), ease: "power2.inOut" }, 0);
        stepTl.to(".prev-route-f, .prev-route-k", { opacity: 0.16, duration: dur(0.28), ease: "power2.inOut" }, 0.02);
        stepTl.fromTo(".prev-parent-K, .prev-parent-F", { opacity: 0 }, { opacity: 1, stagger: dur(0.12), duration: dur(0.24), ease: "power2.out" }, 0.3);
        stepTl.to(".prev-parent-K .part3-parent-arrow-path, .prev-parent-F .part3-parent-arrow-path", { strokeDashoffset: 0, stagger: dur(0.12), duration: dur(0.48), ease: "power2.out" }, 0.34);
        stepTl.to(".prev-parent-K .part3-parent-arrow-head, .prev-parent-K .part3-parent-label, .prev-parent-F .part3-parent-arrow-head, .prev-parent-F .part3-parent-label", { opacity: 1, stagger: dur(0.06), duration: dur(0.16), ease: "power2.out" }, 0.84);
        pulsePart3Nodes(stepTl, ["K", "F", "E"], 0.9, { toScale: 1.08, stagger: 0.08, duration: 0.24 });
        return stepTl;
      },
      () => {
        const stepTl = startPrevStep();
        hideMemoryPanel();
        setPrevCopy("Bây giờ quay lại đúng lúc E mở F. Khi gói 6 được nhận vào Cost[F], nó phải mang theo cửa vào: gói này đến từ E.", ["E -> F", "Cost[F]=6", "Prev[F]=E"]);
        stepTl.to(".prev-path-panel, .prev-route-f, .prev-route-k, .prev-parent-K, .prev-parent-rest, .prev-backtrack-cursor-shell", { opacity: 0, duration: dur(0.28), ease: "power2.in" }, 0);
        stepTl.to(".prev-parent-F", { opacity: 0, duration: dur(0.18), ease: "power2.in" }, 0);
        // Cùng góc máy với scene "Chỉ khi rẻ" để bảng cập nhật hiện lại đúng chỗ cũ.
        moveCameraOnTimeline(stepTl, part3CostSlotCamera.center, part3CostSlotCamera.scale, 0.06, 0.64);
        stepTl.call(() => {
          setEdgeStates({ visible: visibleBeforeF, focus: [[["E", "F"]]], locked: [lockedToE], context: [part3AllEdges] });
          setNodeStates(beforeFState, { focus: ["E", "F"], correct: ["A", "C", "B", "E"], target: ["K"], showNodeCosts: true });
        }, null, 0.36);
        stepTl.fromTo(".prev-update-board", { opacity: 0, scale: 0.9, transformOrigin: "center center" }, { opacity: 1, scale: 1, duration: dur(0.34), ease: "back.out(1.3)" }, 0.58);
        stepTl.fromTo(".prev-good-bundle", { opacity: 0, scale: 0.78 }, { opacity: 1, scale: 1, duration: dur(0.24), ease: "back.out(1.35)" }, 0.72);
        animatePart3FlowChips(stepTl, ".prev-good-bundle", 0.76, 0.95);
        stepTl.call(() => {
          setNodeStates(afterFOnlyState, { focus: ["F"], correct: ["A", "C", "B", "E"], target: ["K"], showNodeCosts: true });
        }, null, 1.6);
        stepTl.to(".prev-cost-empty, .prev-prev-empty", { opacity: 0, scale: 0.82, duration: dur(0.2), ease: "power2.in" }, 1.6);
        // Gói đã được bảng nhận thì biến mất khỏi cạnh, nhường chỗ cho mũi tên Prev.
        stepTl.to(".prev-good-bundle", { opacity: 0, scale: 0.84, duration: dur(0.22), ease: "power2.in" }, 1.62);
        stepTl.fromTo(".prev-cost-current, .prev-prev-current", { opacity: 0, scale: 0.76 }, { opacity: 1, scale: 1, stagger: dur(0.08), duration: dur(0.3), ease: "back.out(1.35)" }, 1.68);
        stepTl.fromTo(".prev-parent-F", { opacity: 0 }, { opacity: 1, duration: dur(0.22), ease: "power2.out" }, 1.78);
        stepTl.to(".prev-parent-F .part3-parent-arrow-path", { strokeDashoffset: 0, duration: dur(0.42), ease: "power2.out" }, 1.8);
        stepTl.to(".prev-parent-F .part3-parent-arrow-head, .prev-parent-F .part3-parent-label", { opacity: 1, duration: dur(0.14), ease: "power2.out" }, 2.16);
        pulsePart3Nodes(stepTl, ["F"], 1.9, { toScale: 1.12, duration: 0.3 });
        return stepTl;
      },
      () => {
        const stepTl = startPrevStep();
        setEdgeStates({ visible: visibleBeforeF, focus: [[["D", "F"]]], locked: [lockedToE], context: [part3AllEdges] });
        setNodeStates(afterFOnlyState, { focus: ["D", "F"], correct: ["A", "C", "B", "E"], target: ["K"], showNodeCosts: true });
        setPrevCopy("D đưa một đề xuất mới cho F. Nếu nhận đề xuất này, Cost[F] sẽ thành 7 và Prev[F] sẽ thành D. Nhưng đây mới chỉ là ứng viên, chưa được ghi.", ["ứng viên", "7 + D", "chưa ghi"]);
        stepTl.to(".prev-good-bundle", { opacity: 0, scale: 0.82, duration: dur(0.18), ease: "power2.in" }, 0);
        // Bảng đang giữ Cost/Prev rồi, mũi tên trên đồ thị tạm cất hẳn cho sạch hình.
        stepTl.to(".prev-parent-F", { opacity: 0, duration: dur(0.22), ease: "power2.in" }, 0);
        stepTl.to(".prev-board-title-accept", { opacity: 0, duration: dur(0.16), ease: "power2.in" }, 0);
        stepTl.fromTo(".prev-board-title-reject", { opacity: 0, y: 5 }, { opacity: 1, y: 0, duration: dur(0.24), ease: "power2.out" }, 0.08);
        stepTl.fromTo(".prev-bad-bundle", { opacity: 0, scale: 0.78 }, { opacity: 1, scale: 1, duration: dur(0.24), ease: "back.out(1.35)" }, 0.12);
        animatePart3FlowChips(stepTl, ".prev-bad-bundle", 0.18, 0.86);
        stepTl.to(".prev-bad-bundle", { opacity: 0, scale: 0.78, duration: dur(0.18), ease: "power2.in" }, 1.18);
        stepTl.fromTo(".prev-cost-reject-chip, .prev-prev-reject-chip", { opacity: 0, x: -78, scale: 0.78, transformOrigin: "center center" }, { opacity: 1, x: -44, scale: 1, stagger: dur(0.08), duration: dur(0.28), ease: "back.out(1.35)" }, 0.96);
        return stepTl;
      },
      () => {
        const stepTl = startPrevStep();
        setPrevCopy("Bây giờ mới so sánh trước khi ghi. Vì 7 lớn hơn 6, đề xuất 7 + D bị chặn: Cost[F] vẫn là 6 và Prev[F] vẫn là E.", ["7 > 6", "chặn", "giữ 6/E"]);
        stepTl.fromTo(".prev-cost-reject-gate", { opacity: 0, scaleY: 0.5, transformOrigin: "center center" }, { opacity: 1, scaleY: 1, duration: dur(0.22), ease: "power2.out" }, 0.12);
        // Đề xuất nhích về phía cổng rồi bị bật lại.
        stepTl.to(".prev-cost-reject-chip, .prev-prev-reject-chip", { x: -24, yoyo: true, repeat: 1, duration: dur(0.18), ease: "power2.inOut" }, 0.24);
        stepTl.fromTo(".prev-board-lock", { opacity: 0, scale: 0.8, transformOrigin: "center center" }, { opacity: 1, scale: 1, duration: dur(0.28), ease: "back.out(1.35)" }, 0.44);
        stepTl.fromTo(".prev-cost-current", { scale: 0.94, transformOrigin: "center center" }, { scale: 1.08, yoyo: true, repeat: 1, duration: dur(0.22), ease: "power2.inOut" }, 0.56);
        stepTl.fromTo(".prev-prev-current", { scale: 0.94, transformOrigin: "center center" }, { scale: 1.08, yoyo: true, repeat: 1, duration: dur(0.24), ease: "power2.inOut" }, 0.72);
        // Chốt xong, mũi tên Prev[F]=E quay lại trên đồ thị như cũ.
        stepTl.to(".prev-parent-F", { opacity: 1, duration: dur(0.3), ease: "power2.out" }, 0.92);
        return stepTl;
      },
      () => {
        const stepTl = startPrevStep();
        setPrevCopy("Khi cần dựng đường, ta đứng ở K và đọc ô Prev[K]. Ô này chỉ sang F, nên bước ngược đầu tiên là K về F.", ["đọc Prev[K]", "F", "K -> F"]);
        stepTl.to(".prev-update-board, .prev-reject-marker, .prev-board-lock, .prev-good-bundle, .prev-bad-bundle, .prev-cost-reject-chip, .prev-prev-reject-chip, .prev-cost-reject-gate", { opacity: 0, duration: dur(0.28), ease: "power2.in" }, 0);
        moveCameraOnTimeline(stepTl, part2Cameras.full.center, part2Cameras.full.scale, 0.06, 0.68);
        stepTl.call(() => {
          setEdgeStates({ context: [part3AllEdges], locked: [finalEdges], focus: [[["F", "K"]]] });
          setNodeStates(finalWithKState, { focus: ["K", "F"], target: ["K"], showNodeCosts: true });
        }, null, 0.36);
        stepTl.fromTo(".prev-parent-K, .prev-parent-F, .prev-parent-rest", { opacity: 0 }, { opacity: 0.9, stagger: dur(0.04), duration: dur(0.22), ease: "power2.out" }, 0.48);
        stepTl.to(".prev-parent-K .part3-parent-arrow-path, .prev-parent-F .part3-parent-arrow-path, .prev-parent-rest .part3-parent-arrow-path", { strokeDashoffset: 0, stagger: dur(0.04), duration: dur(0.28), ease: "power2.out" }, 0.52);
        stepTl.to(".prev-parent-K .part3-parent-arrow-head, .prev-parent-K .part3-parent-label, .prev-parent-F .part3-parent-arrow-head, .prev-parent-F .part3-parent-label, .prev-parent-rest .part3-parent-arrow-head", { opacity: 1, stagger: dur(0.04), duration: dur(0.12), ease: "power2.out" }, 0.84);
        stepTl.fromTo(".prev-backtrack-strip", { opacity: 0, y: 10, transformOrigin: "center center" }, { opacity: 1, y: 0, duration: dur(0.3), ease: "power2.out" }, 0.72);
        stepTl.fromTo(".prev-chain-node-K, .prev-chain-link-F, .prev-chain-node-F", { opacity: 0, scale: 0.78, transformOrigin: "center center" }, { opacity: 1, scale: 1, stagger: dur(0.08), duration: dur(0.24), ease: "back.out(1.35)" }, 0.92);
        stepTl.fromTo(".prev-backtrack-cursor-shell", { opacity: 0, scale: 0.84, transformOrigin: "center center" }, { opacity: 1, scale: 1, duration: dur(0.24), ease: "back.out(1.35)" }, 0.66);
        stepTl.to(".part3-backtrack-cursor", { attr: { transform: `translate(${nodes.F.x} ${nodes.F.y})` }, duration: dur(0.82), ease: "power2.inOut" }, 1.12);
        pulsePart3Nodes(stepTl, ["K", "F"], 1.18, { toScale: 1.1, stagger: 0.18, duration: 0.26 });
        return stepTl;
      },
      () => {
        const stepTl = startPrevStep();
        setPrevCopy("Đang đứng ở F thì đọc Prev[F] = E. Ta lại đi ngược về E. Mỗi ô Prev chỉ cho đúng một bước lùi.", ["đọc Prev[F]", "E", "F -> E"]);
        stepTl.fromTo(".prev-chain-link-E, .prev-chain-node-E", { opacity: 0, scale: 0.78, transformOrigin: "center center" }, { opacity: 1, scale: 1, stagger: dur(0.08), duration: dur(0.24), ease: "back.out(1.35)" }, 0.18);
        stepTl.to(".part3-backtrack-cursor", { attr: { transform: `translate(${nodes.E.x} ${nodes.E.y})` }, duration: dur(0.82), ease: "power2.inOut" }, 0.2);
        pulsePart3Nodes(stepTl, ["F", "E"], 0.24, { toScale: 1.1, stagger: 0.18, duration: 0.26 });
        return stepTl;
      },
      () => {
        const stepTl = startPrevStep();
        setPrevCopy("Tiếp tục đọc các ô Prev còn lại: E về B, B về C, C về A. Khi đã về tới A, ta đảo chiều chuỗi vừa lần ngược là ra đường đi.", ["lần tới A", "đảo chiều", "ra đường"]);
        const route = ["B", "C", "A"];
        stepTl.fromTo(".prev-chain-link-B, .prev-chain-node-B", { opacity: 0, scale: 0.78, transformOrigin: "center center" }, { opacity: 1, scale: 1, stagger: dur(0.08), duration: dur(0.24), ease: "back.out(1.35)" }, 0.16);
        stepTl.to(".part3-backtrack-cursor", { attr: { transform: `translate(${nodes.B.x} ${nodes.B.y})` }, duration: dur(0.62), ease: "power2.inOut" }, 0.14);
        stepTl.fromTo(".prev-chain-link-C, .prev-chain-node-C", { opacity: 0, scale: 0.78, transformOrigin: "center center" }, { opacity: 1, scale: 1, stagger: dur(0.08), duration: dur(0.24), ease: "back.out(1.35)" }, 0.88);
        stepTl.to(".part3-backtrack-cursor", { attr: { transform: `translate(${nodes.C.x} ${nodes.C.y})` }, duration: dur(0.62), ease: "power2.inOut" }, 0.86);
        stepTl.fromTo(".prev-chain-link-A, .prev-chain-node-A", { opacity: 0, scale: 0.78, transformOrigin: "center center" }, { opacity: 1, scale: 1, stagger: dur(0.08), duration: dur(0.24), ease: "back.out(1.35)" }, 1.6);
        stepTl.to(".part3-backtrack-cursor", { attr: { transform: `translate(${nodes.A.x} ${nodes.A.y})` }, duration: dur(0.62), ease: "power2.inOut" }, 1.58);
        route.forEach((node, index) => pulsePart3Nodes(stepTl, [node], 0.2 + index * 0.72, { toScale: 1.1, duration: 0.26 }));
        stepTl.call(() => {
          showBestRoute(part2FinalPath);
          setMetrics("đường ra", "Cost 10", "Prev đủ");
        }, null, 2.24);
        stepTl.to(".part3-prev-chain-back", { opacity: 0.18, duration: dur(0.22), ease: "power2.inOut" }, 2.24);
        stepTl.fromTo(".part3-prev-chain-final", { opacity: 0, y: 8, transformOrigin: "center center" }, { opacity: 1, y: 0, duration: dur(0.34), ease: "power2.out" }, 2.34);
        return stepTl;
      },
      () => {
        el.stageShell.classList.remove("is-visual-proof");
        setPrevCopy("Vậy trong code, Prev không phải một bước phụ. Nó được tạo từ nhu cầu dựng lại đường, và phải nằm ngay trong nhánh vừa nhận Cost mới.", ["thêm Prev", "cùng if", "viết code"]);
        gsap.set(".prev-backtrack-strip", { opacity: 0 });
        showPart3Code("prev", "Nhớ đường đi", "chờ viết");
        setCodeActiveLines([20, 21, 22]);
        return null;
      },
    ];

    setCameraView(part2Cameras.full);
    setEdgeStates({ context: [part3AllEdges], focus: [part2Edges.toK] });
    setNodeStates(finalWithKState, { focus: ["K"], target: ["K"], showNodeCosts: true });
    hideMemoryPanel();
    hideCodePanel();
    el.stageShell.classList.add("is-visual-proof");
    setPrevCopy("Đến cuối thuật toán, nếu chỉ return Cost[K], ta mới biết kết quả là 10. Nhưng muốn chỉ đường thật sự thì còn thiếu một thứ.", ["Cost[K]", "10", "thiếu đường"]);

    drawPart3PrevPathPanel({ className: "is-deferred prev-path-panel", x: 675, y: 92 });
    drawPart3PrevUpdateBoard("F", { className: "is-deferred prev-update-board" });
    drawPart3UpdateBundle({ from: "E", to: "F", cost: 6, parent: "E", tone: "focus", className: "is-deferred prev-good-bundle", offset: -28, startT: 0.12, endT: 0.82 });
    drawPart3UpdateBundle({ from: "D", to: "F", cost: 7, parent: "D", tone: "warn", className: "is-deferred prev-bad-bundle", offset: 22, startT: 0.12, endT: 0.78 });
    drawPart3EdgeTrace(["A", "C", "B", "E", "F"], { tone: "focus", className: "is-deferred prev-route-f", offset: -16 });
    drawPart3EdgeTrace(part2FinalPath, { tone: "focus", className: "is-deferred prev-route-k", offset: 16 });
    drawPart3ParentArrow("K", "F", { className: "is-deferred prev-parent prev-parent-K", text: "Prev[K]=F" });
    drawPart3ParentArrow("F", "E", { className: "is-deferred prev-parent prev-parent-F", text: "Prev[F]=E" });
    drawPart3ParentArrow("E", "B", { className: "is-deferred prev-parent prev-parent-rest" });
    drawPart3ParentArrow("B", "C", { className: "is-deferred prev-parent prev-parent-rest" });
    drawPart3ParentArrow("C", "A", { className: "is-deferred prev-parent prev-parent-rest" });
    drawPart3NodeMarker("K", { tone: "warn", symbol: "question", className: "is-deferred prev-question-marker" });
    drawPart3NodeMarker("F", { tone: "warn", symbol: "x", className: "is-deferred prev-reject-marker" });
    drawPart3BacktrackCursor("K", "is-deferred prev-backtrack-cursor-shell");
    drawPart3PrevBacktrackStrip({ className: "is-deferred prev-backtrack-strip", x: 360, y: 460 });

    gsap.set(
      ".prev-path-panel, .prev-update-board, .prev-good-bundle, .prev-bad-bundle, .prev-route-f, .prev-route-k, .prev-parent, .prev-question-marker, .prev-reject-marker, .prev-backtrack-cursor-shell, .prev-backtrack-strip",
      { opacity: 0, transformOrigin: "center center" },
    );
    gsap.set(".prev-cost-current, .prev-prev-current, .prev-board-lock, .prev-cost-reject-chip, .prev-prev-reject-chip, .prev-cost-reject-gate, .prev-board-title-reject", { opacity: 0, transformOrigin: "center center" });
    gsap.set(".prev-parent .part3-parent-arrow-head, .prev-parent .part3-parent-label", { opacity: 0 });
    gsap.set(".part3-prev-duplicate-mark", { opacity: 0 });
    gsap.set(".part3-prev-chain-back .part3-prev-chain-chip, .part3-prev-chain-back .part3-prev-chain-link, .part3-prev-chain-final", { opacity: 0, transformOrigin: "center center" });
    prepareSvgPathDraw(".prev-route-f .part3-edge-trace-path, .prev-route-k .part3-edge-trace-path, .prev-parent .part3-parent-arrow-path");
    queueNextPrevStep();
    animatePart3SceneIntro(tl, 0.16);
    moveCameraOnTimeline(tl, part2Cameras.full.center, part2Cameras.full.scale, 0.18, 0.58);
    return tl;
  }

  function enterPart3ReplayScene() {
    const tl = makeTimeline();
    // Replay chạy tự động một mạch, nhưng tốc độ thay đổi theo chương:
    // mở đầu chậm để khán giả bắt nhịp, các vòng giữa nhanh dần vì lặp lại
    // cùng một khuôn, chậm hẳn lại ở hai lượt cuối (chốt G trước rồi mới
    // gặp K), rồi thong thả khi lần ngược Prev ra đường đi cuối cùng.
    const setReplaySpeed = (at, speed) => tl.call(() => tl.timeScale(speed), null, at);
    if (!prefersReducedMotion) {
      tl.timeScale(0.95);
      setReplaySpeed(3.04, 1.2); // vòng chốt C/B: luật vừa xem xong, tăng nhẹ
      setReplaySpeed(10.9, 1.5); // vòng E/D/F: cùng một nhịp, lướt nhanh
      setReplaySpeed(19.9, 0.9); // lượt G rồi gặp K: chậm để nhấn "G rẻ hơn nên phải chốt trước, min sau mới là đích"
      setReplaySpeed(25.35, 1.15); // lần ngược Prev từng bước
      setReplaySpeed(30.8, 0.95); // đảo chiều, vẽ đường cuối cùng
    }
    const finalEdges = [
      ["A", "C"],
      ["C", "B"],
      ["B", "E"],
      ["E", "F"],
      ["F", "K"],
    ];
    const emptyState = makePart2State({});
    const seedState = makePart2State({ A: ["open", 0, "-"] });
    const settleAState = makePart2State({ A: ["settled", 0, "-"] });
    const settleBState = makePart2State({
      A: ["settled", 0, "-"],
      C: ["settled", 2, "A"],
      B: ["settled", 3, "C"],
      D: ["open", 5, "C"],
      E: ["open", 6, "A"],
    });
    const settleEState = makePart2State({
      A: ["settled", 0, "-"],
      C: ["settled", 2, "A"],
      B: ["settled", 3, "C"],
      D: ["open", 5, "C"],
      E: ["settled", 4, "B"],
    });
    const settleFState = makePart2State({
      A: ["settled", 0, "-"],
      C: ["settled", 2, "A"],
      B: ["settled", 3, "C"],
      D: ["settled", 5, "C"],
      E: ["settled", 4, "B"],
      F: ["settled", 6, "E"],
      G: ["open", 9, "E"],
    });
    const edgesAfterA = [...part2Edges.fromA];
    const edgesAfterC = [...edgesAfterA, ...part2Edges.fromC];
    const edgesAfterB = [...edgesAfterC, ...part2Edges.fromB];
    const edgesAfterE = [...edgesAfterB, ...part2Edges.fromE];
    const edgesAfterD = [...edgesAfterE, ...part2Edges.fromD];
    const edgesAfterF = [...edgesAfterD, ["F", "K"]];
    const edgesAfterG = [...edgesAfterF, ["G", "K"]];
    const treeAfterA = [
      ["A", "C"],
      ["A", "B"],
      ["A", "D"],
      ["A", "E"],
    ];
    const treeAfterC = [
      ["A", "C"],
      ["C", "B"],
      ["C", "D"],
      ["A", "E"],
    ];
    const treeAfterB = [
      ["A", "C"],
      ["C", "B"],
      ["C", "D"],
      ["B", "E"],
    ];
    const treeAfterE = [...treeAfterB, ["E", "F"], ["E", "G"]];
    const treeAfterF = [...treeAfterE, ["F", "K"]];

    const memory = {
      empty: {},
      seed: { cost: { A: 0 }, focus: ["A"] },
      aSettled: { cost: { A: 0 }, visited: ["A"], focus: ["A"] },
      afterA: {
        cost: { A: 0, C: 2, B: 4, D: 7, E: 6 },
        visited: ["A"],
        prev: { C: "A", B: "A", D: "A", E: "A" },
        focus: ["C", "B", "D", "E"],
      },
      afterC: {
        cost: { A: 0, C: 2, B: 3, D: 5, E: 6 },
        visited: ["A", "C"],
        prev: { C: "A", B: "C", D: "C", E: "A" },
        focus: ["B", "D"],
      },
      afterB: {
        cost: { A: 0, C: 2, B: 3, D: 5, E: 4 },
        visited: ["A", "C", "B"],
        prev: { C: "A", B: "C", D: "C", E: "B" },
        focus: ["E"],
      },
      afterE: {
        cost: { A: 0, C: 2, B: 3, E: 4, D: 5, F: 6, G: 9 },
        visited: ["A", "C", "B", "E"],
        prev: { C: "A", B: "C", D: "C", E: "B", F: "E", G: "E" },
        focus: ["F", "G"],
      },
      afterD: {
        cost: { A: 0, C: 2, B: 3, E: 4, D: 5, F: 6, G: 9 },
        visited: ["A", "C", "B", "E", "D"],
        prev: { C: "A", B: "C", D: "C", E: "B", F: "E", G: "E" },
        focus: ["D"],
        danger: ["F:6", "G:9"],
      },
      afterF: {
        cost: { A: 0, C: 2, B: 3, E: 4, D: 5, F: 6, G: 9, K: 10 },
        visited: ["A", "C", "B", "E", "D", "F"],
        prev: { C: "A", B: "C", D: "C", E: "B", F: "E", G: "E", K: "F" },
        focus: ["K"],
      },
      afterG: {
        cost: { A: 0, C: 2, B: 3, E: 4, D: 5, F: 6, G: 9, K: 10 },
        visited: ["A", "C", "B", "E", "D", "F", "G"],
        prev: { C: "A", B: "C", D: "C", E: "B", F: "E", G: "E", K: "F" },
        focus: ["G"],
      },
    };

    function selectorForNodes(nodeIds) {
      return nodeIds.map((node) => `.node-${node}`).join(", ");
    }

    function selectorForEdges(edgeList) {
      const keys = toEdgeKeys(edgeList);
      return keys.map((key) => `.edge-group[data-edge="${key}"], .edge-label-group[data-edge="${key}"]`).join(", ");
    }

    function setReplayCode(lines, route, cost, prev, context = 2) {
      setCodeActiveLines(lines);
      focusCodeLines(lines, context);
      setMetrics(route, cost, prev);
    }

    function applyReplayFrame({
      lines,
      state,
      visible = [],
      focusEdges = [],
      locked = [],
      context = [],
      focus = [],
      target = [],
      correct = [],
      memoryState = {},
      metrics = ["", "", ""],
      codeContext = 2,
    }) {
      setReplayCode(lines, metrics[0], metrics[1], metrics[2], codeContext);
      setEdgeStates({ visible, focus: focusEdges, locked, context });
      setNodeStates(state, { focus, target, correct, showNodeCosts: true });
      showMemoryPanel(memoryState);
    }

    function revealNodes(nodeIds, at) {
      const selector = selectorForNodes(nodeIds);
      if (!selector) return;
      tl.fromTo(
        selector,
        { opacity: 0, scale: 0.78, transformOrigin: "center center" },
        { opacity: 1, scale: 1, stagger: dur(0.08), duration: dur(0.44), ease: "back.out(1.45)", immediateRender: false },
        at,
      );
    }

    function revealEdges(edgeList, at) {
      const selector = selectorForEdges(edgeList);
      if (!selector) return;
      tl.fromTo(
        selector,
        { opacity: 0 },
        { opacity: 1, stagger: dur(0.04), duration: dur(0.38), ease: "power2.out", immediateRender: false },
        at,
      );
    }

    function moveReplayProbe(node, at, duration = 0.42) {
      const point = nodes[node];
      tl.to(".part3-probe-cursor", { attr: { transform: `translate(${point.x} ${point.y})` }, duration: dur(duration), ease: "power2.inOut" }, at);
      pulsePart3Nodes(tl, [node], at + 0.06, { toScale: 1.1, duration: 0.24 });
    }

    function animateReplayBundles() {
      // Replay is already explained by code focus, edge highlight, and memory.
      // Extra moving update labels made this scene visually noisy.
    }

    function flashReplayRejectTrace(at, groupClass) {
      const group = `.${groupClass}`;
      tl.fromTo(
        group,
        { opacity: 0 },
        { opacity: 0.86, stagger: dur(0.06), duration: dur(0.18), ease: "power2.out", immediateRender: false },
        at,
      );
      tl.to(`${group} .part3-edge-trace-path`, { strokeDashoffset: 0, stagger: dur(0.05), duration: dur(0.42), ease: "power2.out" }, at + 0.04);
      tl.to(group, { opacity: 0, duration: dur(0.28), ease: "power2.in" }, at + 1.08);
    }

    function revealReplayParent(selector, at) {
      tl.fromTo(selector, { opacity: 0 }, { opacity: 0.92, duration: dur(0.22), ease: "power2.out", immediateRender: false }, at);
      tl.to(`${selector} .part3-parent-arrow-path`, { strokeDashoffset: 0, duration: dur(0.58), ease: "power2.out" }, at + 0.04);
      tl.to(`${selector} .part3-parent-arrow-head, ${selector} .part3-parent-label`, { opacity: 1, duration: dur(0.14), ease: "power2.out" }, at + 0.5);
    }

    drawPart3Probe("A", "is-deferred replay-probe-shell");
    drawPart3UpdateBundle({ from: "A", to: "C", cost: 2, parent: "A", className: "is-deferred replay-bundle replay-bundle-A", offset: -18 });
    drawPart3UpdateBundle({ from: "A", to: "B", cost: 4, parent: "A", className: "is-deferred replay-bundle replay-bundle-A", offset: 10 });
    drawPart3UpdateBundle({ from: "A", to: "D", cost: 7, parent: "A", className: "is-deferred replay-bundle replay-bundle-A", offset: 24 });
    drawPart3UpdateBundle({ from: "A", to: "E", cost: 6, parent: "A", className: "is-deferred replay-bundle replay-bundle-A", offset: -24 });
    drawPart3UpdateBundle({ from: "C", to: "B", cost: 3, parent: "C", className: "is-deferred replay-bundle replay-bundle-C", offset: -22 });
    drawPart3UpdateBundle({ from: "C", to: "D", cost: 5, parent: "C", className: "is-deferred replay-bundle replay-bundle-C", offset: 24 });
    drawPart3UpdateBundle({ from: "B", to: "E", cost: 4, parent: "B", className: "is-deferred replay-bundle replay-bundle-B", offset: -22 });
    drawPart3UpdateBundle({ from: "E", to: "F", cost: 6, parent: "E", className: "is-deferred replay-bundle replay-bundle-E", offset: -18 });
    drawPart3UpdateBundle({ from: "E", to: "G", cost: 9, parent: "E", className: "is-deferred replay-bundle replay-bundle-E", offset: 22 });
    drawPart3UpdateBundle({ from: "D", to: "F", cost: 7, parent: "D", tone: "warn", className: "is-deferred replay-reject-bundle", offset: 22 });
    drawPart3UpdateBundle({ from: "D", to: "G", cost: 12, parent: "D", tone: "warn", className: "is-deferred replay-reject-bundle", offset: -26 });
    drawPart3UpdateBundle({ from: "F", to: "K", cost: 10, parent: "F", className: "is-deferred replay-bundle replay-bundle-F", offset: -20 });
    drawPart3UpdateBundle({ from: "G", to: "K", cost: 11, parent: "G", tone: "warn", className: "is-deferred replay-reject-bundle", offset: 20 });
    drawPart3EdgeTrace(["D", "F"], { tone: "warn", className: "is-deferred replay-reject-trace replay-reject-from-D", offset: 18 });
    drawPart3EdgeTrace(["D", "G"], { tone: "warn", className: "is-deferred replay-reject-trace replay-reject-from-D", offset: -18 });
    drawPart3EdgeTrace(["G", "K"], { tone: "warn", className: "is-deferred replay-reject-trace replay-reject-from-G", offset: 14 });
    drawPart3ParentArrow("K", "F", { className: "is-deferred replay-parent replay-parent-K" });
    drawPart3ParentArrow("F", "E", { className: "is-deferred replay-parent replay-parent-F" });
    drawPart3ParentArrow("E", "B", { className: "is-deferred replay-parent replay-parent-E" });
    drawPart3ParentArrow("B", "C", { className: "is-deferred replay-parent replay-parent-B" });
    drawPart3ParentArrow("C", "A", { className: "is-deferred replay-parent replay-parent-C" });
    drawPart3BacktrackCursor("K", "is-deferred replay-backtrack-cursor-shell");
    drawPart3PrevBacktrackStrip({ className: "is-deferred replay-backtrack-strip", x: 292, y: 452 });
    drawPart3EdgeTrace(part2FinalPath, { tone: "focus", className: "is-deferred replay-final-trace", offset: -10 });

    setCameraView(part2Cameras.aTight);
    setEdgeStates({ visible: [] });
    setNodeStates(emptyState, { showNodeCosts: true });
    showMemoryPanel(memory.empty);
    showPart3Code("replay", "Mã giả hoàn chỉnh", "chạy từ đầu");
    setReplayCode([], "khởi tạo", "trống", "trống", 1);

    gsap.set(
      ".replay-probe-shell, .replay-bundle, .replay-reject-bundle, .replay-reject-trace, .replay-parent, .replay-backtrack-cursor-shell, .replay-backtrack-strip, .replay-final-trace",
      { opacity: 0, transformOrigin: "center center" },
    );
    gsap.set(".replay-parent .part3-parent-arrow-head, .replay-parent .part3-parent-label", { opacity: 0 });
    gsap.set(".replay-backtrack-strip .part3-prev-chain-back .part3-prev-chain-chip, .replay-backtrack-strip .part3-prev-chain-back .part3-prev-chain-link, .replay-backtrack-strip .part3-prev-chain-final", {
      opacity: 0,
      transformOrigin: "center center",
    });
    prepareSvgPathDraw(".replay-parent .part3-parent-arrow-path, .replay-final-trace .part3-edge-trace-path, .replay-reject-trace .part3-edge-trace-path");

    animatePart3SceneIntro(tl, 0.18);
    tl.to(".stage-copy", { opacity: 0.16, duration: dur(0.5), ease: "power2.out" }, 2.72);
    tl.call(() => {
      applyReplayFrame({
        lines: [5],
        state: seedState,
        focus: ["A"],
        memoryState: memory.seed,
        metrics: ["Cost[start]", "A = 0", "chưa có Prev"],
        codeContext: 1,
      });
    }, null, 0.78);
    revealNodes(["A"], 0.86);
    pulsePart3Nodes(tl, ["A"], 1.05, { toScale: 1.14, duration: 0.3 });

    tl.fromTo(".replay-probe-shell", { opacity: 0, scale: 0.84 }, { opacity: 1, scale: 1, duration: dur(0.28), ease: "back.out(1.35)" }, 1.54);
    tl.call(() => {
      applyReplayFrame({
        lines: [10],
        state: seedState,
        focus: ["A"],
        memoryState: memory.seed,
        metrics: ["lượt 1", "min = A", "quét Cost"],
      });
    }, null, 1.48);
    moveReplayProbe("A", 1.62, 0.3);

    tl.call(() => {
      applyReplayFrame({
        lines: [17],
        state: settleAState,
        focus: ["A"],
        memoryState: memory.aSettled,
        metrics: ["A không phải K", "Visited[A]", "sắp mở kề"],
      });
    }, null, 2.28);
    pulsePart3Nodes(tl, ["A"], 2.38, { toScale: 1.12, duration: 0.26 });
    moveCameraOnTimeline(tl, part2Cameras.frontier.center, part2Cameras.frontier.scale, 2.78, 0.92);
    tl.call(() => {
      applyReplayFrame({
        lines: [23],
        state: part2States.start,
        visible: edgesAfterA,
        focusEdges: part2Edges.fromA,
        locked: treeAfterA,
        focus: ["C", "B", "D", "E"],
        memoryState: memory.afterA,
        metrics: ["mở kề A", "4 Cost mới", "Prev = A"],
      });
    }, null, 3.08);
    revealEdges(part2Edges.fromA, 3.16);
    revealNodes(["C", "B", "D", "E"], 3.26);
    animateReplayBundles(".replay-bundle-A", 3.2, 1.18);

    tl.call(() => {
      applyReplayFrame({
        lines: [10],
        state: part2States.start,
        visible: edgesAfterA,
        locked: treeAfterA,
        focus: ["C"],
        memoryState: { ...memory.afterA, focus: ["C"] },
        metrics: ["lượt 2", "min = C", "Cost nhỏ nhất"],
      });
    }, null, 5.0);
    moveReplayProbe("C", 5.1, 0.42);
    tl.call(() => {
      applyReplayFrame({
        lines: [17],
        state: part3AfterCSettledState,
        visible: edgesAfterA,
        locked: treeAfterA,
        focus: ["C"],
        memoryState: { ...memory.afterA, visited: ["A", "C"], focus: ["C"] },
        metrics: ["C không phải K", "Visited[C]", "mở B/D"],
      });
    }, null, 5.78);
    tl.call(() => {
      applyReplayFrame({
        lines: [23],
        state: part2States.afterC,
        visible: edgesAfterC,
        focusEdges: part2Edges.fromC,
        locked: treeAfterC,
        focus: ["B", "D"],
        memoryState: memory.afterC,
        metrics: ["mở kề C", "B,D rẻ hơn", "Prev = C"],
      });
    }, null, 6.48);
    revealEdges(part2Edges.fromC, 6.56);
    animateReplayBundles(".replay-bundle-C", 6.62, 1.02);
    pulsePart3Nodes(tl, ["B", "D"], 7.18, { toScale: 1.1, stagger: 0.08, duration: 0.24 });

    tl.call(() => {
      applyReplayFrame({
        lines: [10],
        state: part2States.afterC,
        visible: edgesAfterC,
        locked: treeAfterC,
        focus: ["B"],
        memoryState: { ...memory.afterC, focus: ["B"] },
        metrics: ["lượt 3", "min = B", "Cost 3"],
      });
    }, null, 8.08);
    moveReplayProbe("B", 8.18, 0.42);
    tl.call(() => {
      applyReplayFrame({
        lines: [17],
        state: settleBState,
        visible: edgesAfterC,
        locked: treeAfterC,
        focus: ["B"],
        memoryState: { ...memory.afterC, visited: ["A", "C", "B"], focus: ["B"] },
        metrics: ["B không phải K", "Visited[B]", "mở E"],
      });
    }, null, 8.86);
    moveCameraOnTimeline(tl, part2Cameras.middle.center, part2Cameras.middle.scale, 9.1, 0.82);
    tl.call(() => {
      applyReplayFrame({
        lines: [23],
        state: part2States.afterB,
        visible: edgesAfterB,
        focusEdges: part2Edges.fromB,
        locked: treeAfterB,
        focus: ["E"],
        memoryState: memory.afterB,
        metrics: ["mở kề B", "E: 4 < 6", "Prev[E]=B"],
      });
    }, null, 9.5);
    revealEdges(part2Edges.fromB, 9.58);
    animateReplayBundles(".replay-bundle-B", 9.62, 0.9);

    tl.call(() => {
      applyReplayFrame({
        lines: [10],
        state: part2States.afterB,
        visible: edgesAfterB,
        locked: treeAfterB,
        focus: ["E"],
        memoryState: { ...memory.afterB, focus: ["E"] },
        metrics: ["lượt 4", "min = E", "Cost 4"],
      });
    }, null, 10.9);
    moveReplayProbe("E", 11.0, 0.42);
    tl.call(() => {
      applyReplayFrame({
        lines: [17],
        state: settleEState,
        visible: edgesAfterB,
        locked: treeAfterB,
        focus: ["E"],
        memoryState: { ...memory.afterB, visited: ["A", "C", "B", "E"], focus: ["E"] },
        metrics: ["E không phải K", "Visited[E]", "mở F/G"],
      });
    }, null, 11.66);
    tl.call(() => {
      applyReplayFrame({
        lines: [23],
        state: part2States.afterE,
        visible: edgesAfterE,
        focusEdges: part2Edges.fromE,
        locked: treeAfterE,
        focus: ["F", "G"],
        memoryState: memory.afterE,
        metrics: ["mở kề E", "F,G nhận Cost", "Prev = E"],
      });
    }, null, 12.34);
    revealEdges(part2Edges.fromE, 12.42);
    revealNodes(["F", "G"], 12.52);
    animateReplayBundles(".replay-bundle-E", 12.48, 1.04);

    tl.call(() => {
      applyReplayFrame({
        lines: [10],
        state: part2States.afterE,
        visible: edgesAfterE,
        locked: treeAfterE,
        focus: ["D"],
        memoryState: { ...memory.afterE, focus: ["D"] },
        metrics: ["lượt 5", "min = D", "Cost 5"],
      });
    }, null, 14.02);
    moveReplayProbe("D", 14.12, 0.42);
    tl.call(() => {
      applyReplayFrame({
        lines: [17],
        state: part2States.afterD,
        visible: edgesAfterE,
        locked: treeAfterE,
        focus: ["D"],
        memoryState: { ...memory.afterE, visited: ["A", "C", "B", "E", "D"], focus: ["D"] },
        metrics: ["D không phải K", "Visited[D]", "thử F/G"],
      });
    }, null, 14.76);
    tl.call(() => {
      applyReplayFrame({
        lines: [21],
        state: part2States.afterD,
        visible: edgesAfterD,
        locked: treeAfterE,
        context: treeAfterE,
        focus: ["D", "F", "G"],
        memoryState: memory.afterD,
        metrics: ["mở kề D", "7 và 12 bị chặn", "Prev giữ nguyên"],
      });
    }, null, 15.38);
    revealEdges(part2Edges.fromD, 15.46);
    flashReplayRejectTrace(15.58, "replay-reject-from-D");
    animateReplayBundles(".replay-reject-bundle", 15.52, 0.96);
    pulsePart3Nodes(tl, ["F", "G"], 16.18, { toScale: 1.08, stagger: 0.08, duration: 0.24 });

    moveCameraOnTimeline(tl, part2Cameras.toK.center, part2Cameras.toK.scale, 16.7, 0.88);
    tl.call(() => {
      applyReplayFrame({
        lines: [10],
        state: part2States.afterD,
        visible: edgesAfterD,
        locked: treeAfterE,
        focus: ["F"],
        memoryState: { ...memory.afterD, danger: [], focus: ["F"] },
        metrics: ["lượt 6", "min = F", "Cost 6"],
      });
    }, null, 17.0);
    moveReplayProbe("F", 17.1, 0.42);
    tl.call(() => {
      applyReplayFrame({
        lines: [17],
        state: settleFState,
        visible: edgesAfterD,
        locked: treeAfterE,
        focus: ["F"],
        memoryState: { ...memory.afterD, danger: [], visited: ["A", "C", "B", "E", "D", "F"], focus: ["F"] },
        metrics: ["F không phải K", "Visited[F]", "mở K"],
      });
    }, null, 17.78);
    tl.call(() => {
      applyReplayFrame({
        lines: [23],
        state: part2States.afterF,
        visible: edgesAfterF,
        focusEdges: [["F", "K"]],
        locked: treeAfterF,
        focus: ["K"],
        target: ["K"],
        memoryState: memory.afterF,
        metrics: ["mở kề F", "K = 10", "Prev[K]=F"],
      });
    }, null, 18.42);
    revealEdges([["F", "K"]], 18.5);
    revealNodes(["K"], 18.62);
    animateReplayBundles(".replay-bundle-F", 18.56, 0.92);

    // Lượt 7: K đã có Cost 10 nhưng G mới là min (9 < 10) — vòng lặp phải chốt
    // G trước, thử nốt đường tới K qua G (9 + 2 = 11, không rẻ hơn nên bị chặn),
    // rồi lượt sau min mới đúng là K.
    tl.call(() => {
      applyReplayFrame({
        lines: [10],
        state: part2States.afterF,
        visible: edgesAfterF,
        locked: treeAfterF,
        focus: ["G"],
        target: ["K"],
        // Tô cả K:10 để người xem tự bắt cặp phép so: G 9 thắng K 10.
        memoryState: { ...memory.afterF, focus: ["G"], amber: ["K:10"] },
        metrics: ["lượt 7", "min = G", "9 < 10, chưa tới K"],
      });
    }, null, 20.0);
    moveReplayProbe("G", 20.1, 0.42);
    tl.call(() => {
      applyReplayFrame({
        lines: [17],
        state: part2States.afterG,
        visible: edgesAfterF,
        locked: treeAfterF,
        focus: ["G"],
        target: ["K"],
        memoryState: memory.afterG,
        metrics: ["G không phải K", "Visited[G]", "thử kề G"],
      });
    }, null, 20.86);
    tl.call(() => {
      applyReplayFrame({
        lines: [21],
        state: part2States.afterG,
        visible: edgesAfterG,
        locked: treeAfterF,
        context: treeAfterF,
        focus: ["G", "K"],
        target: ["K"],
        memoryState: { ...memory.afterG, danger: ["K:10"] },
        metrics: ["mở kề G", "9 + 2 = 11 bị chặn", "K giữ Prev = F"],
      });
    }, null, 21.5);
    revealEdges([["G", "K"]], 21.58);
    flashReplayRejectTrace(21.66, "replay-reject-from-G");
    pulsePart3Nodes(tl, ["K"], 22.3, { toScale: 1.08, duration: 0.24 });

    tl.call(() => {
      applyReplayFrame({
        lines: [10],
        state: part2States.afterG,
        visible: edgesAfterG,
        locked: treeAfterF,
        focus: ["K"],
        target: ["K"],
        memoryState: { ...memory.afterG, focus: ["K"] },
        metrics: ["lượt 8", "min = K", "đã tới đích"],
      });
    }, null, 23.2);
    moveReplayProbe("K", 23.3, 0.46);
    tl.call(() => {
      applyReplayFrame({
        lines: [16],
        state: part2States.afterG,
        visible: edgesAfterG,
        locked: treeAfterF,
        focus: ["K"],
        target: ["K"],
        memoryState: { ...memory.afterG, focus: ["K"] },
        metrics: ["min == end", "break", "không mở thêm"],
        codeContext: 3,
      });
    }, null, 24.08);
    pulsePart3Nodes(tl, ["K"], 24.2, { toScale: 1.16, duration: 0.32 });

    moveCameraOnTimeline(tl, part2Cameras.full.center, part2Cameras.full.scale, 24.52, 0.92);
    tl.to(".replay-probe-shell, .replay-bundle, .replay-reject-bundle", { opacity: 0, duration: dur(0.24), ease: "power2.in" }, 24.42);
    tl.call(() => {
      applyReplayFrame({
        lines: [27],
        state: part2States.afterG,
        visible: edgesAfterG,
        locked: finalEdges,
        context: treeAfterF,
        focus: ["K"],
        target: ["K"],
        memoryState: { ...memory.afterG, focus: ["K"] },
        metrics: ["return", "Cost[K]=10", "Prev để lần ngược"],
        codeContext: 4,
      });
    }, null, 24.86);
    tl.fromTo(".replay-backtrack-strip", { opacity: 0, y: 10, transformOrigin: "center center" }, { opacity: 1, y: 0, duration: dur(0.34), ease: "power2.out" }, 25.08);
    tl.fromTo(".replay-backtrack-cursor-shell", { opacity: 0, scale: 0.84, transformOrigin: "center center" }, { opacity: 1, scale: 1, duration: dur(0.28), ease: "back.out(1.35)" }, 25.18);

    revealReplayParent(".replay-parent-K", 25.42);
    tl.fromTo(".prev-chain-node-K, .prev-chain-link-F, .prev-chain-node-F", { opacity: 0, scale: 0.78, transformOrigin: "center center" }, { opacity: 1, scale: 1, stagger: dur(0.08), duration: dur(0.24), ease: "back.out(1.35)" }, 25.48);
    tl.to(".part3-backtrack-cursor", { attr: { transform: `translate(${nodes.F.x} ${nodes.F.y})` }, duration: dur(0.86), ease: "power2.inOut" }, 25.62);
    pulsePart3Nodes(tl, ["K", "F"], 25.68, { toScale: 1.1, stagger: 0.18, duration: 0.26 });

    revealReplayParent(".replay-parent-F", 26.54);
    tl.fromTo(".prev-chain-link-E, .prev-chain-node-E", { opacity: 0, scale: 0.78, transformOrigin: "center center" }, { opacity: 1, scale: 1, stagger: dur(0.08), duration: dur(0.24), ease: "back.out(1.35)" }, 26.62);
    tl.to(".part3-backtrack-cursor", { attr: { transform: `translate(${nodes.E.x} ${nodes.E.y})` }, duration: dur(0.86), ease: "power2.inOut" }, 26.72);
    pulsePart3Nodes(tl, ["F", "E"], 26.78, { toScale: 1.1, stagger: 0.18, duration: 0.26 });

    revealReplayParent(".replay-parent-E", 27.66);
    tl.fromTo(".prev-chain-link-B, .prev-chain-node-B", { opacity: 0, scale: 0.78, transformOrigin: "center center" }, { opacity: 1, scale: 1, stagger: dur(0.08), duration: dur(0.24), ease: "back.out(1.35)" }, 27.74);
    tl.to(".part3-backtrack-cursor", { attr: { transform: `translate(${nodes.B.x} ${nodes.B.y})` }, duration: dur(0.78), ease: "power2.inOut" }, 27.84);
    pulsePart3Nodes(tl, ["E", "B"], 27.9, { toScale: 1.1, stagger: 0.18, duration: 0.26 });

    revealReplayParent(".replay-parent-B", 28.68);
    tl.fromTo(".prev-chain-link-C, .prev-chain-node-C", { opacity: 0, scale: 0.78, transformOrigin: "center center" }, { opacity: 1, scale: 1, stagger: dur(0.08), duration: dur(0.24), ease: "back.out(1.35)" }, 28.76);
    tl.to(".part3-backtrack-cursor", { attr: { transform: `translate(${nodes.C.x} ${nodes.C.y})` }, duration: dur(0.78), ease: "power2.inOut" }, 28.86);
    pulsePart3Nodes(tl, ["B", "C"], 28.92, { toScale: 1.1, stagger: 0.18, duration: 0.26 });

    revealReplayParent(".replay-parent-C", 29.7);
    tl.fromTo(".prev-chain-link-A, .prev-chain-node-A", { opacity: 0, scale: 0.78, transformOrigin: "center center" }, { opacity: 1, scale: 1, stagger: dur(0.08), duration: dur(0.24), ease: "back.out(1.35)" }, 29.78);
    tl.to(".part3-backtrack-cursor", { attr: { transform: `translate(${nodes.A.x} ${nodes.A.y})` }, duration: dur(0.78), ease: "power2.inOut" }, 29.88);
    pulsePart3Nodes(tl, ["C", "A"], 29.94, { toScale: 1.1, stagger: 0.18, duration: 0.26 });

    tl.call(() => {
      applyReplayFrame({
        lines: [27],
        state: part2States.afterG,
        visible: edgesAfterG,
        locked: finalEdges,
        context: treeAfterF,
        focus: ["A", "C", "B", "E", "F", "K"],
        target: ["K"],
        correct: ["A", "C", "B", "E", "F"],
        memoryState: { ...memory.afterG, focus: ["K"] },
        metrics: ["đảo chiều", "A -> ... -> K", "đường cuối"],
        codeContext: 4,
      });
    }, null, 30.9);
    tl.to(".part3-prev-chain-back", { opacity: 0.18, duration: dur(0.24), ease: "power2.inOut" }, 30.92);
    tl.fromTo(".part3-prev-chain-final", { opacity: 0, y: 8, transformOrigin: "center center" }, { opacity: 1, y: 0, duration: dur(0.36), ease: "power2.out" }, 31.02);
    tl.fromTo(".replay-final-trace", { opacity: 0 }, { opacity: 1, duration: dur(0.24), ease: "power2.out" }, 31.1);
    tl.to(".replay-final-trace .part3-edge-trace-path", { strokeDashoffset: 0, duration: dur(1.18), ease: "power2.out" }, 31.18);
    return tl;
  }

  function hidePart4Views() {
    if (!el.part4Workspace) return;
    [el.part4ComplexityView, el.part4HeapView, el.part4NegativeView, el.part4FinalView].forEach((view) => {
      if (view) view.classList.remove("is-active");
    });
  }

  function showPart4View(view) {
    if (!el.part4Workspace) return;
    hidePart4Views();
    el.part4Workspace.setAttribute("aria-hidden", "false");
    if (view) view.classList.add("is-active");
  }

  function p4Fmt(value) {
    return value === Infinity ? "?" : String(value);
  }

  function part4EdgeKey(from, to) {
    return [from, to].sort().join(":");
  }

  function resetPart4ComplexityState() {
    const dist = {};
    const prev = {};
    const visited = {};
    part4Order.forEach((node) => {
      dist[node] = Infinity;
      prev[node] = null;
      visited[node] = false;
    });
    dist.A = 0;
    part4ComplexityState = {
      dist,
      prev,
      visited,
      phase: "scan",
      round: 1,
      best: null,
      current: null,
      scanning: null,
      activeEdge: null,
      updatedNode: null,
      showTree: false,
      scanOps: 0,
      edgeOps: 0,
      sampleStopped: false,
      codeFocusKeys: ["seedCost"],
      codeStatusText: "Bắt đầu bằng Cost[start] = 0. FOR 1 sẽ quét A -> F để tìm đỉnh có cost nhỏ nhất chưa Visited.",
    };
  }

  function snapshotPart4Complexity() {
    const s = part4ComplexityState;
    if (!s) return null;
    return {
      dist: { ...s.dist },
      prev: { ...s.prev },
      visited: { ...s.visited },
      phase: s.phase,
      round: s.round,
      best: s.best,
      current: s.current,
      scanning: s.scanning,
      activeEdge: s.activeEdge,
      updatedNode: s.updatedNode,
      showTree: s.showTree,
      scanOps: s.scanOps,
      edgeOps: s.edgeOps,
      sampleStopped: s.sampleStopped,
      codeFocusKeys: [...s.codeFocusKeys],
      codeStatusText: s.codeStatusText,
    };
  }

  function restorePart4Complexity(snapshot) {
    if (!snapshot) return;
    part4ComplexityState = {
      dist: { ...snapshot.dist },
      prev: { ...snapshot.prev },
      visited: { ...snapshot.visited },
      phase: snapshot.phase,
      round: snapshot.round,
      best: snapshot.best,
      current: snapshot.current,
      scanning: snapshot.scanning,
      activeEdge: snapshot.activeEdge,
      updatedNode: snapshot.updatedNode,
      showTree: snapshot.showTree,
      scanOps: snapshot.scanOps,
      edgeOps: snapshot.edgeOps,
      sampleStopped: snapshot.sampleStopped,
      codeFocusKeys: [...snapshot.codeFocusKeys],
      codeStatusText: snapshot.codeStatusText,
    };
    renderPart4Complexity();
    preparePart4ComplexityAdvance();
  }

  function pushPart4ComplexityHistory() {
    const snapshot = snapshotPart4Complexity();
    if (!snapshot) return;
    part4ComplexityHistory.push(snapshot);
    if (part4ComplexityHistory.length > 80) part4ComplexityHistory.shift();
  }

  function restorePreviousPart4ComplexityStep() {
    if (activeTimeline || getActivePart().id !== "part4" || currentScene !== 0) return;
    const snapshot = part4ComplexityHistory.pop();
    if (!snapshot) return;
    restorePart4Complexity(snapshot);
  }

  function restartPart4ComplexityScene() {
    if (getActivePart().id !== "part4" || currentScene !== 0) return;
    if (activeTimeline) {
      activeTimeline.kill();
      activeTimeline = null;
    }
    part4ComplexityHistory = [];
    resetPart4ComplexityState();
    renderPart4Complexity();
    preparePart4ComplexityAdvance();
    updatePauseButton();
  }

  function setPart4CodeFocus(keys, text) {
    const s = part4ComplexityState;
    if (!s) return;
    s.codeFocusKeys = Array.isArray(keys) ? keys : [keys];
    s.codeStatusText = text;
  }

  function getPart4NodeState(node) {
    const s = part4ComplexityState;
    if (!s) return "unknown";
    if (s.visited[node]) return "visited";
    if (node === s.current && s.phase === "edges") return "current";
    if (node === s.scanning) return "scan";
    if (node === s.best) return "best";
    if (s.dist[node] < Infinity) return "frontier";
    return "unknown";
  }

  function getPart4TreeEdges() {
    const s = part4ComplexityState;
    const result = new Set();
    if (!s || !s.showTree) return result;
    part4Order.forEach((node) => {
      if (s.prev[node]) result.add(part4EdgeKey(node, s.prev[node]));
    });
    return result;
  }

  function getPart4ActiveCodeKeys() {
    const s = part4ComplexityState;
    if (!s) return new Set();
    if (s.phase === "scan") return new Set(["while", "min", "for1", "ifMin", "ifMinBetter", "setMin"]);
    if (s.phase === "edges") return new Set(["closeOpen", "for2", "setKe", "newCost", "ifRelax", "setDist", "setPrev"]);
    return new Set(["return"]);
  }

  function getPart4DoneCodeKeys() {
    const s = part4ComplexityState;
    const done = new Set();
    if (!s) return done;
    ["fn", "costArray", "visitedArray", "prevArray", "seedCost"].forEach((key) => done.add(key));
    if (s.phase === "edges" || s.phase === "finished") {
      ["while", "min", "for1", "ifMin", "ifMinBetter", "setMin", "closeIfMinBetter", "closeIfMinReachable", "closeFor1", "empty", "end", "closeOpen"].forEach((key) => done.add(key));
    }
    if (s.phase === "scan" && s.round > 1) {
      ["for2", "setKe", "newCost", "ifRelax", "setDist", "setPrev", "closeIfRelax", "closeFor2", "closeWhile"].forEach((key) => done.add(key));
    }
    if (s.phase === "finished") part4CodeLines.forEach((line) => done.add(line.key));
    return done;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function renderPart4Code() {
    const s = part4ComplexityState;
    if (!s || !el.part4CodeBlock) return;
    const trace = getPart4ActiveCodeKeys();
    const done = getPart4DoneCodeKeys();
    const active = new Set(s.codeFocusKeys && s.codeFocusKeys.length ? s.codeFocusKeys : [...trace]);

    el.part4CodeBlock.innerHTML = part4CodeLines
      .map((line) => {
        const classes = ["part4-code-line"];
        if (!line.text) classes.push("is-dim");
        if (done.has(line.key)) classes.push("is-done");
        if (trace.has(line.key) && !active.has(line.key)) classes.push("is-trace");
        if (active.has(line.key)) classes.push(s.phase === "edges" ? "is-active-2" : "is-active");
        return `<span class="${classes.join(" ")}">${escapeHtml(line.text || " ")}</span>`;
      })
      .join("");

    const focusLine = el.part4CodeBlock.querySelector(".is-active, .is-active-2");
    if (focusLine) {
      el.part4CodeBlock.scrollTop = Math.max(0, focusLine.offsetTop - el.part4CodeBlock.clientHeight * 0.35);
    }
    el.part4CodeStatus.textContent = s.codeStatusText;
    el.part4CodePhase.textContent = s.phase === "scan" ? "FOR 1" : s.phase === "edges" ? "FOR 2" : "DONE";
  }

  function renderPart4Graph() {
    const s = part4ComplexityState;
    if (!s || !el.part4GraphSvg) return;
    clearLayer(el.part4GraphSvg);

    const defs = svg("defs");
    defs.innerHTML = `
      <filter id="part4EdgeGlow" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="4" result="blur"></feGaussianBlur>
        <feMerge><feMergeNode in="blur"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge>
      </filter>
      <filter id="part4TreeGlow" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="4" result="blur"></feGaussianBlur>
        <feMerge><feMergeNode in="blur"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge>
      </filter>
    `;
    el.part4GraphSvg.appendChild(defs);

    const tree = getPart4TreeEdges();
    part4Edges.forEach(([from, to, cost]) => {
      const a = part4Nodes[from];
      const b = part4Nodes[to];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const length = Math.hypot(dx, dy) || 1;
      const nx = -dy / length;
      const ny = dx / length;
      const d = `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
      const key = part4EdgeKey(from, to);
      const edgeClasses = ["part4-edge"];
      if (s.activeEdge === key) edgeClasses.push("is-active");
      if (tree.has(key)) edgeClasses.push("is-tree");

      el.part4GraphSvg.appendChild(svg("path", { d, class: "part4-edge-shadow" }));
      el.part4GraphSvg.appendChild(svg("path", { d, class: edgeClasses.join(" ") }));

      const labelX = (a.x + b.x) / 2 + nx * 20;
      const labelY = (a.y + b.y) / 2 + ny * 20 - 2;
      el.part4GraphSvg.appendChild(svg("rect", { x: labelX - 18, y: labelY - 17, width: 36, height: 24, rx: 8, class: "part4-weight-bg" }));
      const text = svg("text", { x: labelX, y: labelY, "text-anchor": "middle", class: "part4-weight" });
      text.textContent = String(cost);
      el.part4GraphSvg.appendChild(text);
    });

    part4Order.forEach((node) => {
      const p = part4Nodes[node];
      const group = svg("g", {
        class: `part4-node is-${getPart4NodeState(node)}${s.updatedNode === node ? " is-updated" : ""}`,
      });
      group.appendChild(svg("circle", { cx: p.x, cy: p.y, r: 48, class: "part4-node-halo" }));
      group.appendChild(svg("circle", { cx: p.x, cy: p.y, r: 31, class: "part4-node-dot" }));
      const label = svg("text", { x: p.x, y: p.y + 7, class: "part4-node-label" });
      label.textContent = node;
      group.appendChild(label);
      const dist = svg("text", { x: p.x, y: p.y + 54, class: "part4-node-dist" });
      dist.textContent = `Cost ${p4Fmt(s.dist[node])}`;
      group.appendChild(dist);
      el.part4GraphSvg.appendChild(group);
    });
  }

  function renderPart4Strip() {
    const s = part4ComplexityState;
    if (!s || !el.part4ScanStrip) return;
    el.part4ScanStrip.innerHTML = part4Order
      .map((node) => {
        const classes = ["part4-scan-cell"];
        if (node === s.scanning) classes.push("is-scan");
        if (node === s.best) classes.push("is-best");
        if (s.visited[node]) classes.push("is-visited");
        return `<div class="${classes.join(" ")}"><strong>${node}</strong><span>${p4Fmt(s.dist[node])}</span></div>`;
      })
      .join("");
  }

  function renderPart4Table() {
    const s = part4ComplexityState;
    if (!s || !el.part4DistTable) return;
    el.part4DistTable.innerHTML = `
      <tr><th>Đỉnh</th><th>Cost</th><th>Trạng thái</th><th>Prev</th></tr>
      ${part4Order
        .map((node) => {
          const isFocus = node === s.scanning || node === s.best || node === s.current || node === s.updatedNode;
          const status = s.visited[node] ? "đã chốt" : s.dist[node] < Infinity ? "đang mở" : "chưa biết";
          return `<tr class="${isFocus ? "is-focus" : ""}"><td><b>${node}</b></td><td>${p4Fmt(s.dist[node])}</td><td>${status}</td><td>${s.prev[node] || "-"}</td></tr>`;
        })
        .join("")}
    `;
  }

  function getPart4FinalPath(target) {
    const s = part4ComplexityState;
    if (!s || s.dist[target] === Infinity) return [];
    const path = [];
    const seen = new Set();
    let current = target;
    while (current && !seen.has(current)) {
      path.push(current);
      if (current === "A") break;
      seen.add(current);
      current = s.prev[current];
    }
    return path[path.length - 1] === "A" ? path.reverse() : [];
  }

  function renderPart4Text() {
    const s = part4ComplexityState;
    if (!s) return;
    el.part4RoundCounter.textContent = s.round;
    el.part4ScanCounter.textContent = s.scanOps;
    el.part4EdgeCounter.textContent = s.edgeOps;
    el.part4TreeButton.textContent = s.showTree ? "Ẩn cây" : "Hiện cây";
    el.part4BackButton.disabled = Boolean(activeTimeline) || part4ComplexityHistory.length === 0;
    el.part4ResetButton.disabled = Boolean(activeTimeline);
    el.part4TreeButton.disabled = Boolean(activeTimeline);

    if (s.phase === "scan") {
      el.part4PhaseTitle.textContent = "FOR 1: quét toàn bộ đỉnh";
      el.part4PhaseBadge.textContent = "O(V)";
      el.part4OverlayTitle.textContent = s.scanning ? `Đang nhìn ô ${s.scanning}` : "Sẵn sàng chạy FOR 1";
      el.part4OverlayText.textContent = s.best
        ? `Min tạm thời là ${s.best} với Cost ${p4Fmt(s.dist[s.best])}, nhưng FOR 1 vẫn phải nhìn hết các ô còn lại.`
        : "Quét lần lượt A -> F, bỏ qua đỉnh đã chốt và chọn Cost nhỏ nhất.";
      el.part4Formula.textContent = "V lần x V đỉnh";
      el.part4FormulaNote.textContent = "Mỗi vòng chọn min tốn một lượt quét qua danh sách đỉnh.";
      el.part4Result.textContent = "Click Tiếp để chạy trọn một vòng FOR 1. Lần click sau sẽ chạy FOR 2.";
      setMetrics(`vòng ${s.round}`, `${s.scanOps} lượt quét`, `${s.edgeOps} cạnh`);
    } else if (s.phase === "edges") {
      el.part4PhaseTitle.textContent = `FOR 2: duyệt cạnh của ${s.current}`;
      el.part4PhaseBadge.textContent = "+E";
      el.part4OverlayTitle.textContent = `Đã chọn min: ${s.current}`;
      el.part4OverlayText.textContent = `Bây giờ chỉ mở các cạnh kề của ${s.current}. Toàn bộ thuật toán cộng lại sẽ đi qua các cạnh kề này.`;
      el.part4Formula.textContent = "O(V^2 + E)";
      el.part4FormulaNote.textContent = "Phần chọn min là V^2, phần mở hàng xóm cộng theo số cạnh.";
      el.part4Result.innerHTML = `Đỉnh <b>${s.current}</b> đã được đánh dấu Visited. Click Tiếp để chạy trọn FOR 2 của đỉnh này.`;
      setMetrics(`min = ${s.current}`, `${s.scanOps} lượt quét`, `${s.edgeOps} cạnh`);
    } else {
      const path = getPart4FinalPath("F");
      el.part4PhaseTitle.textContent = s.sampleStopped ? "Đủ mẫu để đếm bước" : "Hoàn tất đếm bước";
      el.part4PhaseBadge.textContent = "O(V^2)";
      el.part4OverlayTitle.textContent = "Đã thấy nguồn gốc O(V^2)";
      el.part4OverlayText.textContent = s.sampleStopped
        ? "Không cần chạy tới mọi đỉnh. Chỉ cần thấy mỗi vòng đều quét V ô, và các cạnh được cộng dồn theo E."
        : "Vì E không vượt quá V^2 trong graph hữu hạn, bản quét mảng thường được rút gọn thành O(V^2).";
      el.part4Formula.textContent = "O(V^2 + E) -> O(V^2)";
      el.part4FormulaNote.textContent = "Với bản code vừa xây, điểm nghẽn là chọn min bằng cách quét mảng.";
      el.part4Result.innerHTML = s.sampleStopped
        ? `Dừng minh họa sau <b>${s.round}</b> cặp FOR 1/FOR 2: đã đủ để suy ra phần scan là V lần x V đỉnh, còn FOR 2 tính theo số cạnh.`
        : path.length
          ? `Ví dụ đường tốt tới F: <b>${path.join(" -> ")}</b>, cost <b>${s.dist.F}</b>.`
          : "Thuật toán đã kết thúc.";
      setMetrics(s.sampleStopped ? "mẫu đủ" : "xong", `${s.scanOps} lượt quét`, `${s.edgeOps} cạnh`);
    }
  }

  function renderPart4Complexity() {
    if (!part4ComplexityState) return;
    renderPart4Graph();
    renderPart4Strip();
    renderPart4Table();
    renderPart4Text();
    renderPart4Code();
  }

  function part4ReachableDone() {
    const s = part4ComplexityState;
    return !s || part4Order.every((node) => s.visited[node] || s.dist[node] === Infinity);
  }

  function part4ComplexityNextLabel() {
    const s = part4ComplexityState;
    if (!s || s.phase === "finished") return null;
    return s.phase === "scan" ? "Chạy FOR 1" : "Chạy FOR 2";
  }

  function preparePart4ComplexityAdvance() {
    const label = part4ComplexityNextLabel();
    prepareVisualAdvance(label ? advancePart4Complexity : null, label);
  }

  function finishPart4InternalStep() {
    activeTimeline = null;
    visualAdvanceBlocked = false;
    const s = part4ComplexityState;
    if (s && s.phase !== "finished") {
      preparePart4ComplexityAdvance();
    } else {
      pendingVisualAdvance = null;
      pendingVisualLabel = null;
      updateControlAvailability();
    }
    updatePauseButton();
    renderPart4Complexity();
  }

  function beginPart4InternalTimeline() {
    visualAdvanceBlocked = true;
    pendingVisualAdvance = null;
    pendingVisualLabel = null;
    updateControlAvailability();
    const tl = gsap.timeline({
      defaults: { ease: "power2.out" },
      onComplete: finishPart4InternalStep,
    });
    activeTimeline = tl;
    paused = false;
    updatePauseButton();
    return tl;
  }

  function advancePart4Complexity() {
    const s = part4ComplexityState;
    if (!s || s.phase === "finished") return;
    pushPart4ComplexityHistory();
    if (s.phase === "scan") runPart4ScanLoop();
    else runPart4EdgesLoop();
  }

  function runPart4ScanLoop() {
    const s = part4ComplexityState;
    const tl = beginPart4InternalTimeline();
    s.best = null;
    s.current = null;
    s.activeEdge = null;
    s.updatedNode = null;

    tl.call(() => {
      setPart4CodeFocus(["while", "min"], `Vòng ${s.round}: đặt min = null trước khi quét FOR 1.`);
      renderPart4Complexity();
    });
    tl.to({}, { duration: dur(0.12) });
    tl.call(() => {
      setPart4CodeFocus(["for1"], "Bắt đầu FOR 1: duyệt từng ô Cost để tìm đỉnh nhỏ nhất chưa Visited.");
      renderPart4Complexity();
    });
    tl.to({}, { duration: dur(0.12) });

    part4Order.forEach((node) => {
      tl.call(() => {
        s.scanning = node;
        s.scanOps += 1;
        const bestText = s.best ? `${s.best} với d=${p4Fmt(s.dist[s.best])}` : "chưa có";
        setPart4CodeFocus(["for1", "ifMin"], `dinh = ${node}: Visited=${s.visited[node] ? "true" : "false"}, Cost=${p4Fmt(s.dist[node])}; min hiện tại: ${bestText}.`);
        renderPart4Complexity();
      });
      tl.to({}, { duration: dur(0.14) });
      tl.call(() => {
        if (!s.visited[node] && s.dist[node] < Infinity && (s.best === null || s.dist[node] < s.dist[s.best])) {
          const oldMin = s.best ? p4Fmt(s.dist[s.best]) : "trống";
          s.best = node;
          setPart4CodeFocus(["ifMinBetter", "setMin"], `${node} tốt hơn min cũ ${oldMin}, nên gán min = ${node}.`);
        } else if (s.visited[node]) {
          setPart4CodeFocus(["ifMin"], `${node} đã Visited, FOR 1 bỏ qua.`);
        } else if (s.dist[node] === Infinity) {
          setPart4CodeFocus(["ifMin"], `${node} chưa tới được, nên chưa thể là min.`);
        } else {
          setPart4CodeFocus(["ifMinBetter"], `${node} có Cost=${p4Fmt(s.dist[node])}, không nhỏ hơn Cost[min] của ${s.best}.`);
        }
        renderPart4Complexity();
      });
      tl.to({}, { duration: dur(0.13) });
    });

    tl.call(() => {
      s.scanning = null;
      if (!s.best) {
        s.phase = "finished";
        s.showTree = true;
        setPart4CodeFocus(["empty", "return"], "Không còn đỉnh reachable trong Cost, thuật toán break và trả kết quả.");
        renderPart4Complexity();
        return;
      }
      s.current = s.best;
      s.visited[s.current] = true;
      s.phase = "edges";
      setPart4CodeFocus(["end", "closeOpen"], `FOR 1 kết thúc: chọn min = ${s.current}, đánh dấu Visited[${s.current}] = true.`);
      renderPart4Complexity();
    });
  }

  function runPart4EdgesLoop() {
    const s = part4ComplexityState;
    const tl = beginPart4InternalTimeline();
    const current = s.current;
    const neighbors = current ? part4Adjacency[current] : [];
    s.best = null;
    s.updatedNode = null;

    tl.call(() => {
      setPart4CodeFocus(["for2"], `Bắt đầu FOR 2: chỉ duyệt canh of map[min] với min = ${current}.`);
      renderPart4Complexity();
    });
    tl.to({}, { duration: dur(0.12) });

    neighbors.forEach((edge) => {
      tl.call(() => {
        s.activeEdge = part4EdgeKey(edge.from, edge.to);
        s.updatedNode = null;
        s.edgeOps += 1;
        setPart4CodeFocus(["for2", "setKe", "newCost"], `Đang xét cạnh ${edge.from} -> ${edge.to}: ke = ${edge.to}, newCost = Cost[min] + ${edge.cost}.`);
        renderPart4Complexity();
      });
      tl.to({}, { duration: dur(0.14) });
      tl.call(() => {
        if (s.visited[edge.to]) {
          setPart4CodeFocus(["ifRelax"], `${edge.to} đã Visited, không cập nhật lại.`);
          renderPart4Complexity();
          return;
        }
        const candidate = s.dist[current] + edge.cost;
        setPart4CodeFocus(["ifRelax"], `Ứng viên tới ${edge.to}: ${p4Fmt(s.dist[current])} + ${edge.cost} = ${candidate}, so với Cost[${edge.to}] = ${p4Fmt(s.dist[edge.to])}.`);
        renderPart4Complexity();
      });
      tl.to({}, { duration: dur(0.15) });
      tl.call(() => {
        if (!s.visited[edge.to]) {
          const candidate = s.dist[current] + edge.cost;
          if (candidate < s.dist[edge.to]) {
            s.dist[edge.to] = candidate;
            s.prev[edge.to] = current;
            s.updatedNode = edge.to;
            setPart4CodeFocus(["setDist", "setPrev"], `Cập nhật Cost[${edge.to}] = ${candidate} và Prev[${edge.to}] = ${current}.`);
          } else {
            setPart4CodeFocus(["ifRelax"], `Không cập nhật ${edge.to} vì ứng viên không rẻ hơn số đang giữ.`);
          }
        }
        renderPart4Complexity();
      });
      tl.to({}, { duration: dur(0.13) });
    });

    tl.call(() => {
      s.activeEdge = null;
      s.updatedNode = null;
      if (part4ReachableDone() || s.round >= part4ComplexityDemoRounds) {
        s.phase = "finished";
        s.showTree = true;
        s.sampleStopped = !part4ReachableDone();
        setPart4CodeFocus(
          ["closeWhile", "return"],
          s.sampleStopped
            ? "Dừng mẫu ở đây: đã thấy while lặp lại FOR 1, và FOR 2 chỉ cộng theo các cạnh được mở."
            : "Không còn đỉnh cần xử lý. Đếm lại thấy phần scan là V x V, phần cạnh là E.",
        );
      } else {
        s.round += 1;
        s.phase = "scan";
        s.current = null;
        setPart4CodeFocus(["while", "min"], `Quay lại while cho vòng ${s.round}: chuẩn bị tìm min tiếp.`);
      }
      renderPart4Complexity();
    });
  }

  function enterPart4ComplexityScene() {
    showPart4View(el.part4ComplexityView);
    part4ComplexityHistory = [];
    resetPart4ComplexityState();
    renderPart4Complexity();
    preparePart4ComplexityAdvance();
    const tl = makeTimeline();
    tl.fromTo(".part4-complexity-view > *", { y: 16, opacity: 0 }, { y: 0, opacity: 1, stagger: dur(0.08), duration: dur(0.42), ease: "power3.out" });
    return tl;
  }

  function enterPart4HeapScene() {
    showPart4View(el.part4HeapView);
    pendingVisualAdvance = null;
    pendingVisualLabel = null;
    setMetrics("O(V^2)", "O(log V)", "min nhanh hơn");
    el.part4ArrayRow.innerHTML = ["A:0", "C:2", "B:3", "E:4", "D:5", "F:6", "G:9", "K:10"]
      .map((label) => `<span class="part4-array-chip">${label}</span>`)
      .join("");
    el.part4HeapStack.innerHTML = ["C:2", "B:3", "E:4", "D:5", "F:6"]
      .map((label, index) => `<span class="part4-heap-chip ${index === 0 ? "is-top" : ""}">${label}</span>`)
      .join("");
    gsap.set([el.part4ArrayBar, el.part4HeapBar], { width: "0%" });
    const tl = makeTimeline();
    tl.fromTo(".part4-heap-copy", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: dur(0.5), ease: "power3.out" });
    tl.fromTo(".part4-compare-card", { y: 18, opacity: 0 }, { y: 0, opacity: 1, stagger: dur(0.12), duration: dur(0.46), ease: "power3.out" }, "<0.08");
    tl.to(el.part4ArrayBar, { width: "94%", duration: dur(0.72), ease: "power3.out" }, "<0.1");
    tl.to(el.part4HeapBar, { width: "42%", duration: dur(0.72), ease: "power3.out" }, "<0.14");
    tl.fromTo(".part4-array-chip, .part4-heap-chip", { scale: 0.9 }, { scale: 1, stagger: dur(0.035), duration: dur(0.28), ease: "back.out(1.45)" }, "<0.15");
    return tl;
  }

  function negPart4Fmt(value) {
    return value === Infinity ? "?" : String(value);
  }

  function setPart4NegativeClass(id, className) {
    const target = document.getElementById(id);
    if (target) target.setAttribute("class", className);
  }

  function setPart4NegativeEdge(edge, state = "") {
    const edgeEl = document.getElementById(`part4NegEdge${edge}`);
    const weightEl = document.getElementById(`part4NegWeight${edge}`);
    if (!edgeEl || !weightEl) return;
    const isNegative = edge === "CB";
    const edgeClasses = ["part4-neg-edge"];
    const weightClasses = ["part4-neg-weight"];
    if (isNegative) {
      edgeClasses.push("is-negative");
      weightClasses.push("is-negative");
    }
    if (state) {
      edgeClasses.push(`is-${state}`);
      weightClasses.push(`is-${state}`);
    }
    const markerMap = {
      active: "url(#part4NegArrowActive)",
      good: "url(#part4NegArrowGood)",
      failed: "url(#part4NegArrowBad)",
      bad: "url(#part4NegArrowBad)",
    };
    edgeEl.setAttribute("class", edgeClasses.join(" "));
    edgeEl.setAttribute("marker-end", markerMap[state] || (isNegative ? "url(#part4NegArrowBad)" : "url(#part4NegArrow)"));
    weightEl.setAttribute("class", weightClasses.join(" "));
  }

  function renderPart4Negative() {
    const state = part4NegativeStates[part4NegativeIndex];
    if (!state || !el.part4NegativeTitle) return;
    el.part4NegativeTitle.textContent = state.title;
    el.part4NegativeText.textContent = state.text;
    el.part4NegativeDijkstra.textContent = state.dijkstraB;
    el.part4NegativeResultText.textContent = state.result;
    el.part4NegativeCompare.textContent = state.compare;
    el.part4NegativeCallout.textContent = state.callout;
    el.part4NegativeResult.className = `part4-negative-result ${state.resultTone ? `is-${state.resultTone}` : ""}`.trim();
    el.part4NegativeSteps.innerHTML = part4NegativeStepLabels
      .map((label, index) => {
        const cls = index < part4NegativeIndex ? "is-done" : index === part4NegativeIndex ? "is-active" : "";
        return `<li class="${cls}">${label}</li>`;
      })
      .join("");

    ["A", "B", "C"].forEach((node) => {
      const nodeState = state.node[node] || "";
      setPart4NegativeClass(`part4NegNode${node}`, `part4-neg-node ${nodeState ? `is-${nodeState}` : ""}`.trim());
      const dist = document.getElementById(`part4NegNodeDist${node}`);
      if (dist) dist.textContent = `Cost ${negPart4Fmt(state.dist[node])}`;
    });
    ["AB", "AC", "CB"].forEach((edge) => setPart4NegativeEdge(edge, state.edge[edge] || ""));

    el.part4NegativeDistGrid.innerHTML = ["A", "B", "C"]
      .map((node) => {
        const nodeState = state.node[node] || "";
        const tone = nodeState === "wrong" || nodeState === "locked" ? "is-bad" : nodeState === "frontier" || nodeState === "current" ? "is-warn" : nodeState ? "is-focus" : "";
        return `<div class="${tone}"><span>${node}</span><strong>${negPart4Fmt(state.dist[node])}</strong><small>${state.statuses[node] || "đang mở"}</small></div>`;
      })
      .join("");
    const truthValue = document.getElementById("part4NegativeTruthValue");
    if (truthValue) truthValue.textContent = state.showTruth ? "A -> C -> B = 1" : "?";
    setMetrics(`${part4NegativeIndex + 1}/${part4NegativeStates.length}`, state.dijkstraB, state.showTruth ? "1" : "?");
  }

  function advancePart4Negative() {
    if (part4NegativeIndex >= part4NegativeStates.length - 1) return;
    part4NegativeIndex += 1;
    renderPart4Negative();
    const tl = gsap.timeline({
      defaults: { ease: "power2.out" },
      onComplete: () => {
        activeTimeline = null;
        if (part4NegativeIndex < part4NegativeStates.length - 1) prepareVisualAdvance(advancePart4Negative, "Bước tiếp");
        else updateControlAvailability();
        updatePauseButton();
      },
    });
    activeTimeline = tl;
    visualAdvanceBlocked = true;
    updateControlAvailability();
    tl.fromTo(".part4-negative-story, .part4-negative-side", { y: 8 }, { y: 0, duration: dur(0.24) });
    tl.fromTo(".part4-neg-node, .part4-neg-edge", { opacity: 0.68 }, { opacity: 1, duration: dur(0.28) }, "<");
    tl.call(() => {
      visualAdvanceBlocked = false;
    });
  }

  function enterPart4NegativeScene() {
    showPart4View(el.part4NegativeView);
    part4NegativeIndex = 0;
    renderPart4Negative();
    prepareVisualAdvance(advancePart4Negative, "Bước tiếp");
    const tl = makeTimeline();
    tl.fromTo(".part4-negative-view > *", { y: 16, opacity: 0 }, { y: 0, opacity: 1, stagger: dur(0.08), duration: dur(0.42), ease: "power3.out" });
    return tl;
  }

  function enterPart4FinalScene() {
    showPart4View(el.part4FinalView);
    pendingVisualAdvance = null;
    pendingVisualLabel = null;
    setMetrics("Dijkstra", "không cạnh âm", "O(V^2)");
    const tl = makeTimeline();
    tl.fromTo(".part4-final-copy .panel-kicker, .part4-final-lead", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: dur(0.5), ease: "power3.out" });
    tl.fromTo(
      "#part4FinalName span",
      { y: 34, opacity: 0, scale: 0.86 },
      { y: 0, opacity: 1, scale: 1, stagger: dur(0.07), duration: dur(0.55), ease: "back.out(1.7)" },
      "<0.35",
    );
    tl.fromTo(".part4-final-sub", { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: dur(0.5), ease: "power3.out" }, "<0.45");
    tl.fromTo(".part4-final-grid > div", { y: 22, opacity: 0 }, { y: 0, opacity: 1, stagger: dur(0.12), duration: dur(0.48), ease: "power3.out" }, "<0.2");
    return tl;
  }

  function enterProblemScene() {
    const tl = makeTimeline();
    const sampleRoutes = [
      { path: ["A", "D", "K", "B"], cost: routeCost(["A", "D", "K", "B"]) },
      { path: ["A", "C", "F", "J", "B"], cost: routeCost(["A", "C", "F", "J", "B"]) },
      { path: ["A", "E", "F", "J", "B"], cost: routeCost(["A", "E", "F", "J", "B"]) },
    ];
    const routeEls = sampleRoutes.map((route, index) => {
      const isBestExample = index === 2;
      const path = drawRoute(route.path, isBestExample ? "route-path route-best" : "route-path route-muted", el.activeRouteLayer);
      gsap.set(path, { opacity: isBestExample ? 0.78 : 0.38 });
      return path;
    });

    setMetrics("3 tuyến", sampleRoutes.map((route) => route.cost).join(" / "), "tuyến rẻ nhất");
    renderRouteList(sampleRoutes, { bestIndex: 2 });

    tl.fromTo(".stage-copy", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: dur(0.65), ease: "power3.out" });
    tl.fromTo(".node-group", { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, stagger: dur(0.035), duration: dur(0.45), ease: "back.out(1.6)" }, "<0.08");
    routeEls.forEach((path, index) => {
      animatePathOnTimeline(tl, path, index === 2 ? 0.7 : 0.44, index === 2 ? "<0.1" : "<0.05");
    });
    tl.call(() => setMetrics("3 tuyến", sampleRoutes.map((route) => route.cost).join(" / "), `rẻ nhất = ${sampleRoutes[2].cost}`));
    return tl;
  }

  function enterBruteForceScene() {
    const tl = makeTimeline();
    const routes = exhaustiveRoutes;
    const totalRoutes = routes.length;
    const totalSegments = sumSegments(routes);
    let bestCost = Infinity;
    let bestIndex = -1;
    let walkedSegments = 0;

    showWorkbench("Vét cạn", `${totalRoutes} tuyến phải đi tới B`, `0/${totalRoutes}`, false);
    renderWorkloadGrid(routes);
    renderRouteWindow(routes, 0, -1);
    setMetrics(`0/${totalRoutes}`, "0 đoạn", "-");

    tl.fromTo(".stage-copy", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: dur(0.55), ease: "power3.out" });
    tl.to([el.baseEdges, el.edgeLabels], { opacity: 0.72, duration: dur(0.3) }, "<");

    routes.forEach((route, index) => {
      const routeEl = drawRoute(route.path, "route-path route-active", el.activeRouteLayer);
      gsap.set(routeEl, { opacity: 0 });
      const routeSegments = route.path.length - 1;
      const willImproveBest = route.cost < bestCost;
      const bestBefore = bestCost < Infinity ? bestCost : "-";
      walkedSegments += routeSegments;
      const walkedSoFar = walkedSegments;

      tl.call(() => {
        setMetrics(`${index + 1}/${totalRoutes}`, `${walkedSoFar}/${totalSegments}`, bestBefore);
        setWorkbenchStatus(`${index + 1}/${totalRoutes}`);
        setWorkbenchProgress(index + 1, totalRoutes, "brute");
        updateWorkloadCell(index, "current");
        renderRouteWindow(routes, index, bestIndex);
      });
      // Vài tuyến đầu đi chậm để khán giả hiểu chuyện gì đang diễn ra,
      // phần đuôi tua nhanh dần: cảm giác "quá nhiều" không cần chờ thật lâu.
      const drawDuration = index < 6 ? 0.3 : index < 40 ? 0.028 : 0.007;
      const fadeDuration = index < 6 ? 0.05 : 0.008;
      animatePathOnTimeline(tl, routeEl, 0.44, undefined, drawDuration);
      tl.to(routeEl, { opacity: 0, duration: dur(fadeDuration), ease: "power2.out" });
      tl.call(() => routeEl.remove());

      if (willImproveBest) {
        bestCost = route.cost;
        bestIndex = index;
        const capturedBest = bestIndex;
        tl.call(() => {
          showBestRoute(routes[capturedBest].path);
          updateWorkloadCell(capturedBest, "best");
          setMetrics(`${index + 1}/${totalRoutes}`, `${walkedSoFar}/${totalSegments}`, routes[capturedBest].cost);
          renderRouteWindow(routes, index, capturedBest);
        });
        tl.to({}, { duration: dur(0.035) });
      } else {
        tl.call(() => updateWorkloadCell(index, "done"));
      }
    });

    tl.call(() => {
      const best = routes[bestIndex];
      setMetrics(`${totalRoutes}/${totalRoutes}`, `${totalSegments} đoạn`, best.cost);
      setWorkbenchStatus("đã thử hết");
      setWorkbenchProgress(totalRoutes, totalRoutes, "done");
      renderRouteWindow(routes, totalRoutes - 1, bestIndex);
    });

    return tl;
  }

  function enterSlowScene() {
    const tl = makeTimeline();
    const visibleRoutes = allRoutes.slice(0, Math.min(120, allRoutes.length));
    const routeEls = visibleRoutes.map((route, index) => {
      const offset = ((index % 11) - 5) * 3.8;
      return drawRoute(route.path, "route-path route-burst", el.routeCloud, offset);
    });
    const counter = { value: 0 };

    gsap.set(routeEls, { opacity: 0 });
    renderRouteList(visibleRoutes.slice(0, 12));
    el.routeCountLabel.textContent = `${allRoutes.length} tuyến`;
    setMetrics(`${allRoutes.length} tuyến`, "phải tính", "-");

    tl.fromTo(".stage-copy", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: dur(0.55), ease: "power3.out" });
    tl.to([el.baseEdges, el.edgeLabels, el.nodeLayer], { opacity: 0.5, duration: dur(0.4) }, "<");
    tl.to(routeEls, { opacity: 1, stagger: dur(0.025), duration: dur(0.2), ease: "power2.out" }, "<0.15");
    tl.to(
      counter,
      {
        value: allRoutes.length,
        duration: dur(1.25),
        ease: "power2.out",
        onUpdate: () => {
          setMetrics(`${Math.round(counter.value)}/${allRoutes.length}`, "phải tính", "-");
          el.routeCountLabel.textContent = `${allRoutes.length} tuyến`;
        },
      },
      "<",
    );
    tl.call(() => {
      setMetrics(`${allRoutes.length} tuyến`, "quá nhiều", "-");
      el.routeCountLabel.textContent = `${allRoutes.length} tuyến`;
    });
    return tl;
  }

  function enterPruneRuleScene() {
    const tl = makeTimeline();
    const demoRoute = { path: ["A", "D", "K", "G", "I", "J", "B"], cost: routeCost(["A", "D", "K", "G", "I", "J", "B"]) };
    const demoSafeInfo = {
      path: ["A", "D", "K"],
      cost: routeCost(["A", "D", "K"]),
      pruned: false,
      remaining: ["K", "G", "I", "J", "B"],
    };
    const bestCost = routeCost(benchmarkPath);
    const demoCutInfo = getPruneInfo(demoRoute, bestCost);

    showPruneLens();
    updatePruneLens(demoSafeInfo, bestCost);
    setMetrics("ví dụ", `${demoSafeInfo.cost} <= ${bestCost}`, bestCost);
    renderRouteList([
      { label: `Mốc hiện tại: ${formatRoute(benchmarkPath)}`, cost: bestCost, status: "best" },
      { label: formatRoute(demoRoute.path), cost: demoRoute.cost, status: "current" },
    ]);
    el.routeCountLabel.textContent = "ví dụ cắt";

    const benchmarkEl = drawRoute(benchmarkPath, "route-path route-benchmark", el.activeRouteLayer);
    const demoSafeEl = drawRoute(["A", "D", "K"], "route-path route-active", el.activeRouteLayer);
    const demoCutEdgeEl = drawRoute(["K", "G"], "route-path route-pruned", el.activeRouteLayer);
    const demoSkippedEl = drawRoute(demoCutInfo.remaining, "route-path route-skipped", el.cutLayer);
    const demoMarker = drawCutMarker(nodes[demoCutInfo.cutNode].x, nodes[demoCutInfo.cutNode].y, "DỪNG");
    gsap.set([benchmarkEl, demoSafeEl, demoCutEdgeEl, demoSkippedEl, demoMarker], { opacity: 0 });

    tl.fromTo(".stage-copy", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: dur(0.55), ease: "power3.out" });
    tl.fromTo(el.pruneLens, { y: -14, opacity: 0 }, { y: 0, opacity: 1, duration: dur(0.48), ease: "power3.out" }, "<0.05");
    tl.to([el.baseEdges, el.edgeLabels], { opacity: 0.62, duration: dur(0.32) }, "<");
    animatePathOnTimeline(tl, benchmarkEl, 0.72, "<0.06", 0.5);
    tl.call(() => {
      updatePruneLens(demoSafeInfo, bestCost);
      setMetrics("ví dụ", `${demoSafeInfo.cost} <= ${bestCost}`, bestCost);
      renderRouteList([
        { label: `Mốc hiện tại: ${formatRoute(benchmarkPath)}`, cost: bestCost, status: "best" },
        { label: "Đang đi A -> D -> K", cost: `${demoSafeInfo.cost} <= ${bestCost}`, status: "current" },
      ]);
      el.routeCountLabel.textContent = "ví dụ cắt";
    });
    animatePathOnTimeline(tl, demoSafeEl, 0.72, undefined, 0.52);
    tl.to({}, { duration: dur(0.44) });
    tl.call(() => {
      updatePruneLens(demoCutInfo, bestCost);
      setMetrics(`dừng tại ${demoCutInfo.cutNode}`, `${demoCutInfo.cost} > ${bestCost}`, bestCost);
      renderRouteList([
        { label: `Mốc hiện tại: ${formatRoute(benchmarkPath)}`, cost: bestCost, status: "best" },
        { label: "Cắt A -> D -> K -> G", cost: `${demoCutInfo.cost} > ${bestCost}`, status: "pruned" },
        { label: "Bỏ qua G -> I -> J -> B", cost: "không đi", status: "pruned" },
      ]);
      el.routeCountLabel.textContent = "ví dụ cắt";
    });
    animatePathOnTimeline(tl, demoCutEdgeEl, 0.82, undefined, 0.46);
    tl.fromTo(demoSkippedEl, { opacity: 0 }, { opacity: 0.72, duration: dur(0.24), ease: "power2.out" }, "<0.22");
    tl.fromTo(demoMarker, { scale: 0.65, opacity: 0 }, { scale: 1, opacity: 1, duration: dur(0.28), ease: "back.out(1.7)", transformOrigin: "center center" }, "<0.03");
    return tl;
  }

  function enterPruneSweepScene() {
    const tl = makeTimeline();
    const routes = pruningRoutes;
    const totalRoutes = routes.length;
    const initialBest = { path: benchmarkPath, cost: routeCost(benchmarkPath) };
    const dynamicResult = estimateDynamicPruning(routes, benchmarkPath);
    const bruteSegments = sumSegments(routes);
    const prunedSegments = dynamicResult.segments;
    let walkedSegments = 0;
    let prunedCount = 0;
    let currentBest = { ...initialBest };
    let currentBestIndex = -1;

    showBenchmarkRoute(currentBest.path);
    updatePruneLens(getPruneInfo(routes[0], currentBest.cost), currentBest.cost);
    showPruneLens();
    showWorkbench("Cắt nhánh", `Cùng ${totalRoutes} tuyến, dừng sớm nhiều tuyến`, `0/${totalRoutes}`, true);
    renderWorkloadGrid(routes);
    updateCompareBars(bruteSegments, 0, bruteSegments, prunedSegments);
    setMetrics(`0/${totalRoutes}`, "0 đoạn", currentBest.cost);
    renderPruneRouteWindow(routes, 0, currentBest);

    tl.fromTo(".stage-copy", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: dur(0.55), ease: "power3.out" });
    tl.fromTo(el.pruneLens, { y: -14, opacity: 0 }, { y: 0, opacity: 1, duration: dur(0.48), ease: "power3.out" }, "<0.05");
    tl.to([el.baseEdges, el.edgeLabels], { opacity: 0.62, duration: dur(0.32) }, "<");

    routes.forEach((route, index) => {
      const bestBefore = { path: currentBest.path, cost: currentBest.cost };
      const info = getPruneInfo(route, bestBefore.cost);
      const partialEl = drawRoute(info.path, info.pruned ? "route-path route-pruned" : "route-path route-active", el.activeRouteLayer);
      const remainingEl = info.pruned && info.remaining.length > 1 ? drawRoute(info.remaining, "route-path route-skipped", el.cutLayer) : null;
      gsap.set(partialEl, { opacity: 0 });
      if (remainingEl) gsap.set(remainingEl, { opacity: 0 });
      walkedSegments += info.segments;
      if (info.pruned) prunedCount += 1;
      const improvesBest = !info.pruned && route.cost < currentBest.cost;
      if (improvesBest) {
        currentBest = { path: route.path, cost: route.cost };
        currentBestIndex = index;
      }
      const bestAfter = { path: currentBest.path, cost: currentBest.cost };
      const walkedSoFar = walkedSegments;
      const prunedSoFar = prunedCount;
      const bestIndexAfter = currentBestIndex;

      tl.call(() => {
        updatePruneLens(info, bestBefore.cost);
        setMetrics(`${index + 1}/${totalRoutes}`, `${walkedSoFar}/${prunedSegments}`, bestBefore.cost);
        setWorkbenchStatus(`${index + 1}/${totalRoutes}`);
        setWorkbenchProgress(index + 1, totalRoutes, "prune");
        updateCompareBars(bruteSegments, walkedSoFar, bruteSegments, prunedSegments);
        updateWorkloadCell(index, "current");
        renderPruneRouteWindow(routes, index, bestBefore, { pruned: info.pruned, prunedCount: prunedSoFar });
      });
      animatePathOnTimeline(tl, partialEl, info.pruned ? 0.56 : 0.32, undefined, index < 8 ? 0.08 : 0.01);
      if (remainingEl) {
        tl.to(remainingEl, { opacity: index < 8 ? 0.58 : 0.38, duration: dur(index < 8 ? 0.08 : 0.008), ease: "power2.out" }, "<0.02");
        tl.to(remainingEl, { opacity: 0, duration: dur(index < 8 ? 0.08 : 0.006), ease: "power2.out" });
      }
      tl.to(partialEl, { opacity: 0, duration: dur(index < 8 ? 0.035 : 0.006), ease: "power2.out" }, remainingEl ? "<" : undefined);
      tl.call(() => {
        partialEl.remove();
        if (remainingEl) remainingEl.remove();
        if (improvesBest) {
          showBenchmarkRoute(bestAfter.path);
          updatePruneLensNewBest(route, bestBefore.cost, bestAfter.cost);
          setMetrics(`${index + 1}/${totalRoutes}`, `${walkedSoFar}/${prunedSegments}`, bestAfter.cost);
          renderPruneRouteWindow(routes, index, bestAfter, { pruned: false, prunedCount: prunedSoFar });
        }
        updateWorkloadCell(index, improvesBest || index === bestIndexAfter ? "best" : info.pruned ? "pruned" : "done");
      });
      if (improvesBest) {
        tl.to({}, { duration: dur(0.24) });
      }
    });

    tl.call(() => {
      clearLayer(el.cutLayer);
      hidePruneLens();
      showBenchmarkRoute(dynamicResult.bestPath);
      setMetrics(`${totalRoutes}/${totalRoutes}`, `${prunedSegments} đoạn`, dynamicResult.bestCost);
      setWorkbenchStatus(`${prunedCount}`);
      setWorkbenchProgress(totalRoutes, totalRoutes, "done");
      updateCompareBars(bruteSegments, prunedSegments, bruteSegments, prunedSegments);
      renderRouteList([
        { label: "Thử tất cả", cost: `${bruteSegments} đoạn`, status: "current" },
        { label: "Cắt nhánh", cost: `${prunedSegments} đoạn`, status: "best" },
        { label: "Dừng sớm", cost: `${prunedCount} tuyến`, status: "pruned" },
      ]);
      el.routeCountLabel.textContent = "so sánh";
    });
    return tl;
  }

  function enterConclusionScene() {
    const tl = makeTimeline();
    const visibleRoutes = allRoutes.slice(0, Math.min(80, allRoutes.length));
    const routeEls = visibleRoutes.map((route, index) => {
      const offset = ((index % 9) - 4) * 2.6;
      return drawRoute(route.path, "route-path route-muted", el.routeCloud, offset);
    });
    const bruteSegments = sumSegments(exhaustiveRoutes);
    const prunedSegments = estimateDynamicPruning(pruningRoutes, benchmarkPath).segments;
    const bruteCounter = { value: 0 };
    const pruneCounter = { value: 0 };

    gsap.set(routeEls, { opacity: 0.24 });
    showBestRoute(finalBestPath);
    setComparisonCards([
      { label: "Thử tất cả", value: "0", body: "Đi đến cuối rất nhiều tuyến rồi mới so sánh.", tone: "" },
      { label: "Cắt nhánh", value: "0", body: "Dừng sớm khi chi phí đã vượt đường tốt nhất.", tone: "better" },
      { label: "Điểm còn thiếu", value: "?", body: "Ta vẫn đang thử đường. Cần một cách nghĩ khác.", tone: "next" },
    ]);
    el.comparisonPanel.setAttribute("aria-hidden", "false");
    el.metricStrip.classList.add("is-hidden");
    renderRouteList([
      { label: "Thử tất cả", cost: bruteSegments, status: "current" },
      { label: "Cắt nhánh", cost: prunedSegments, status: "best" },
      { label: "Vẫn còn thiếu", cost: "?", status: "pruned" },
    ]);
    setMetrics("so sánh", "bước quét", routeCost(finalBestPath));

    tl.fromTo(".stage-copy", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: dur(0.55), ease: "power3.out" });
    tl.fromTo(".comparison-col", { y: 22, opacity: 0 }, { y: 0, opacity: 1, stagger: dur(0.12), duration: dur(0.55), ease: "power3.out" }, "<0.1");
    tl.to(
      bruteCounter,
      {
        value: bruteSegments,
        duration: dur(1),
        ease: "power2.out",
        onUpdate: () => {
          el.bruteCount.textContent = Math.round(bruteCounter.value);
        },
      },
      "<0.1",
    );
    tl.to(
      pruneCounter,
      {
        value: prunedSegments,
        duration: dur(1),
        ease: "power2.out",
        onUpdate: () => {
          el.pruneCount.textContent = Math.round(pruneCounter.value);
        },
      },
      "<0.2",
    );
    tl.call(() => {
      el.bruteCount.textContent = bruteSegments;
      el.pruneCount.textContent = prunedSegments;
    });
    return tl;
  }

  function makeTimeline() {
    return gsap.timeline({
      defaults: { ease: "power2.out" },
      onComplete: () => {
        paused = false;
        activeTimeline = null;
        updatePauseButton();
        updateControlAvailability();
      },
    });
  }

  function animatePathOnTimeline(tl, path, opacity, position, duration = 0.48) {
    const length = path.getTotalLength();
    tl.set(path, { opacity: opacity || 1, strokeDasharray: length, strokeDashoffset: length }, position);
    tl.to(path, { strokeDashoffset: 0, duration: dur(duration), ease: "power2.out" });
  }

  function showBestRoute(route) {
    if (bestRouteElement) bestRouteElement.remove();
    if (activeRouteTween) activeRouteTween.kill();
    bestRouteElement = drawRoute(route, "route-path route-best", el.activeRouteLayer);
    const length = bestRouteElement.getTotalLength();
    activeRouteTween = gsap.fromTo(
      bestRouteElement,
      { opacity: 0.5, strokeDasharray: length, strokeDashoffset: length },
      { opacity: 1, strokeDashoffset: 0, duration: dur(0.42), ease: "power2.out" },
    );
  }

  function showBenchmarkRoute(route) {
    if (bestRouteElement) bestRouteElement.remove();
    if (activeRouteTween) activeRouteTween.kill();
    bestRouteElement = drawRoute(route, "route-path route-benchmark", el.activeRouteLayer);
    const length = bestRouteElement.getTotalLength();
    activeRouteTween = gsap.fromTo(
      bestRouteElement,
      { opacity: 0.45, strokeDasharray: length, strokeDashoffset: length },
      { opacity: 0.76, strokeDashoffset: 0, duration: dur(0.36), ease: "power2.out" },
    );
    return bestRouteElement;
  }

  function drawCutMarker(x, y, labelText = "DỪNG") {
    const group = svg("g", { transform: `translate(${x} ${y})` });
    group.appendChild(svg("circle", { r: 26, class: "cut-marker" }));
    group.appendChild(svg("line", { x1: -10, y1: -10, x2: 10, y2: 10, class: "cut-marker-line" }));
    group.appendChild(svg("line", { x1: 10, y1: -10, x2: -10, y2: 10, class: "cut-marker-line" }));
    group.appendChild(svg("text", { x: 0, y: -35, class: "cut-marker-label", "text-anchor": "middle" }));
    group.lastChild.textContent = labelText;
    el.cutLayer.appendChild(group);
    return group;
  }

  function drawRoute(route, className, layer, offset = 0) {
    const path = svg("path", {
      d: routePath(route, offset),
      class: className,
      "data-route": route.join("-"),
    });
    layer.appendChild(path);
    return path;
  }

  function renderRouteList(items, state = {}) {
    el.routeList.innerHTML = "";
    el.routeList.classList.remove("is-state-table");
    el.routeCountLabel.textContent = `${items.length} tuyến`;

    items.forEach((item, index) => {
      const row = normalizeRouteRow(item);
      const div = document.createElement("div");
      div.className = "route-item";

      if (index === state.currentIndex || row.status === "current") div.classList.add("is-current");
      if (index === state.bestIndex || row.status === "best") div.classList.add("is-best");
      if (index === state.prunedIndex || row.status === "pruned") div.classList.add("is-pruned");

      const label = document.createElement("span");
      label.textContent = row.label;
      const cost = document.createElement("strong");
      cost.textContent = row.cost;
      div.appendChild(label);
      div.appendChild(cost);
      el.routeList.appendChild(div);
    });
  }

  function normalizeRouteRow(item) {
    if (Array.isArray(item)) {
      return { label: formatRoute(item), cost: routeCost(item) };
    }

    if (item.path) {
      return { label: formatRoute(item.path), cost: item.cost };
    }

    return item;
  }

  function setMetrics(route, cost, best) {
    el.currentRouteLabel.textContent = route;
    el.currentCostLabel.textContent = cost;
    el.bestCostLabel.textContent = best;
  }

  function setMetricLabels(labels) {
    const [route, cost, best] = labels || ["Đang thử", "Chi phí", "Tốt nhất"];
    el.currentRouteMetricLabel.textContent = route;
    el.currentCostMetricLabel.textContent = cost;
    el.bestCostMetricLabel.textContent = best;
  }

  function togglePause() {
    if (!activeTimeline) return;
    paused = !paused;
    if (paused) {
      activeTimeline.pause();
      if (activeRouteTween) activeRouteTween.pause();
    } else {
      pendingTimelineResume = false;
      activeTimeline.resume();
      if (activeRouteTween) activeRouteTween.resume();
      updateControlAvailability();
    }
    updatePauseButton();
  }

  function updatePauseButton() {
    el.pauseButton.textContent = paused ? "Tiếp tục" : "Tạm dừng";
    el.pauseButton.setAttribute("aria-pressed", String(paused));
    el.pauseButton.disabled = !activeTimeline;
  }

  function clearLayer(layer) {
    while (layer.firstChild) layer.removeChild(layer.firstChild);
  }

  function findAllRoutes(start, end, maxDepth) {
    const routes = [];

    function walk(current, path, cost) {
      if (path.length > maxDepth) return;
      if (current === end) {
        routes.push({ path: [...path], cost });
        return;
      }

      const nextNodes = adjacency.get(current) || [];
      nextNodes.forEach((edge) => {
        if (path.includes(edge.node)) return;
        walk(edge.node, [...path, edge.node], cost + edge.cost);
      });
    }

    walk(start, [start], 0);
    return routes;
  }

  function orderRoutesForExhaustive(routes) {
    const preferredBest = routes.find((route) => pathsEqual(route.path, ["A", "E", "F", "J", "B"]));
    const bestRoute = preferredBest || [...routes].sort((a, b) => a.cost - b.cost)[0];
    const others = routes
      .filter((route) => route !== bestRoute)
      .sort((a, b) => b.cost - a.cost || b.path.length - a.path.length || formatRoute(a.path).localeCompare(formatRoute(b.path)));
    const insertAt = Math.floor(others.length * 0.76);
    return [...others.slice(0, insertAt), bestRoute, ...others.slice(insertAt)];
  }

  function orderRoutesForPruning(routes) {
    const milestonePaths = [
      ["A", "C", "F", "I", "B"],
      ["A", "E", "G", "I", "B"],
      ["A", "E", "F", "I", "B"],
      ["A", "C", "F", "J", "B"],
      ["A", "E", "F", "J", "B"],
    ];
    const milestones = milestonePaths.map((path) => routes.find((route) => pathsEqual(route.path, path))).filter(Boolean);
    const milestoneSet = new Set(milestones);
    const baseRoutes = orderRoutesForExhaustive(routes).filter((route) => !milestoneSet.has(route));
    const slots = [24, 76, 132, 188, 232];
    const ordered = [];
    let milestoneIndex = 0;

    baseRoutes.forEach((route) => {
      while (milestoneIndex < milestones.length && ordered.length >= slots[milestoneIndex]) {
        ordered.push(milestones[milestoneIndex]);
        milestoneIndex += 1;
      }
      ordered.push(route);
    });

    while (milestoneIndex < milestones.length) {
      ordered.push(milestones[milestoneIndex]);
      milestoneIndex += 1;
    }

    return ordered;
  }

  function sumSegments(routes) {
    return routes.reduce((sum, route) => sum + route.path.length - 1, 0);
  }

  function getPruneInfo(route, bestCost) {
    let current = 0;
    for (let index = 0; index < route.path.length - 1; index += 1) {
      current += getEdgeCost(route.path[index], route.path[index + 1]);
      if (current > bestCost) {
        const cutNode = route.path[index + 1];
        const remaining = route.path.slice(index + 1);
        return {
          path: route.path.slice(0, index + 2),
          remaining,
          cutNode,
          cost: current,
          segments: index + 1,
          pruned: true,
        };
      }
    }

    return {
      path: route.path,
      remaining: [route.path[route.path.length - 1]],
      cutNode: route.path[route.path.length - 1],
      cost: route.cost,
      segments: route.path.length - 1,
      pruned: false,
    };
  }

  function estimatePrunedSegments(routes, bestCost) {
    return routes.reduce((sum, route) => {
      let current = 0;
      let segments = 0;
      for (let index = 0; index < route.path.length - 1; index += 1) {
        current += getEdgeCost(route.path[index], route.path[index + 1]);
        segments += 1;
        if (current > bestCost) break;
      }
      return sum + segments;
    }, 0);
  }

  function estimateDynamicPruning(routes, initialBestPath) {
    let currentBestCost = routeCost(initialBestPath);
    let currentBestPath = initialBestPath;
    let segments = 0;
    let prunedCount = 0;

    routes.forEach((route) => {
      const info = getPruneInfo(route, currentBestCost);
      segments += info.segments;
      if (info.pruned) prunedCount += 1;
      if (!info.pruned && route.cost < currentBestCost) {
        currentBestCost = route.cost;
        currentBestPath = route.path;
      }
    });

    return {
      segments,
      prunedCount,
      bestCost: currentBestCost,
      bestPath: currentBestPath,
    };
  }

  function routeCost(route) {
    let total = 0;
    for (let index = 0; index < route.length - 1; index += 1) {
      total += getEdgeCost(route[index], route[index + 1]);
    }
    return total;
  }

  function getEdgeCost(from, to) {
    const cost = pathIndex.get(edgeKey(from, to));
    if (cost == null) {
      throw new Error(`Missing edge ${from}-${to}`);
    }
    return cost;
  }

  function routePath(route, offset = 0) {
    if (!offset) {
      return route.map((id, index) => `${index === 0 ? "M" : "L"} ${nodes[id].x} ${nodes[id].y}`).join(" ");
    }

    const parts = [`M ${nodes[route[0]].x} ${nodes[route[0]].y}`];
    for (let index = 0; index < route.length - 1; index += 1) {
      const from = nodes[route[index]];
      const to = nodes[route[index + 1]];
      const mid = pointBetween(from, to, 0.5);
      const normal = lineNormal(from, to);
      const localOffset = offset * (index % 2 === 0 ? 1 : 0.62);
      parts.push(`Q ${mid.x + normal.x * localOffset} ${mid.y + normal.y * localOffset} ${to.x} ${to.y}`);
    }
    return parts.join(" ");
  }

  function virtualArc(from, to, offset = 48) {
    const start = nodes[from];
    const end = nodes[to];
    const mid = pointBetween(start, end, 0.5);
    const normal = lineNormal(start, end);
    return `M ${start.x} ${start.y} Q ${mid.x + normal.x * offset} ${mid.y + normal.y * offset} ${end.x} ${end.y}`;
  }

  function linePath(from, to) {
    return `M ${nodes[from].x} ${nodes[from].y} L ${nodes[to].x} ${nodes[to].y}`;
  }

  function formatRoute(route) {
    return route.join(" -> ");
  }

  function pathsEqual(a, b) {
    return a.length === b.length && a.every((node, index) => node === b[index]);
  }

  function pointBetween(a, b, t) {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
    };
  }

  function lineNormal(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy) || 1;
    return {
      x: -dy / length,
      y: dx / length,
    };
  }

  function getEdgeLabelPlacement(from, to) {
    const key = edgeKey(from, to);
    if (usesPart2Graph() && part2EdgeLabelPlacements[key]) {
      return part2EdgeLabelPlacements[key];
    }
    return { t: 0.5, n: 14 };
  }

  function resetCamera() {
    if (el.cameraLayer) {
      el.cameraLayer.setAttribute("transform", "matrix(1 0 0 1 0 0)");
    }
  }

  function setCameraView(camera) {
    if (!el.cameraLayer || !camera) return;
    el.cameraLayer.setAttribute("transform", cameraMatrix(camera.center, camera.scale));
  }

  function cameraMatrix(center, scale) {
    const point = typeof center === "string" ? nodes[center] : center;
    const safeScale = scale || 1;
    const tx = 500 - point.x * safeScale;
    const ty = 320 - point.y * safeScale;
    return `matrix(${safeScale} 0 0 ${safeScale} ${tx} ${ty})`;
  }

  function moveCameraOnTimeline(tl, center, scale, position, duration = 0.72) {
    tl.to(
      el.cameraLayer,
      {
        attr: { transform: cameraMatrix(center, scale) },
        duration: dur(duration),
        ease: "power3.inOut",
      },
      position,
    );
  }

  function animateCameraTo(camera, duration = 0.58) {
    if (!el.cameraLayer || !camera) return;
    gsap.to(el.cameraLayer, {
      attr: { transform: cameraMatrix(camera.center, camera.scale) },
      duration: dur(duration),
      ease: "power3.inOut",
    });
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function edgeKey(from, to) {
    return [from, to].sort().join(":");
  }

  function svg(tag, attrs) {
    const element = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs || {}).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    return element;
  }
})();
