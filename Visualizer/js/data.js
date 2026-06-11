/* ============================================================
   data.js — toàn bộ kịch bản 34 scene + dữ liệu đồ thị.
   Text port nguyên văn từ bản cũ; KHÔNG sửa lời thoại ở đây.
   Lời thoại có thể chứa {ROUTES} / {BENCH} — engine điền lúc chạy.
   ============================================================ */
window.DJ = window.DJ || {};

DJ.data = (function () {
  const graphProfiles = {
    part1: {
      terminalNodes: ["A", "B"],
      goal: "B",
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
      goal: "K",
      nodes: {
        A: { x: 96, y: 332 },
        C: { x: 272, y: 186 },
        B: { x: 300, y: 382 },
        D: { x: 408, y: 522 },
        E: { x: 462, y: 326 }, /* tách khỏi đường thẳng A–B–E để cạnh A–E không chui sau B */
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

  /* Phần 1 — các tuyến minh họa */
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

  /* Phần 2 — thứ tự, đường cuối, trạng thái từng mốc */
  const part2NodeOrder = ["A", "C", "B", "D", "E", "F", "G", "K"];
  const part2FinalPath = ["A", "C", "B", "E", "F", "K"];

  function makeState(entries) {
    const out = {};
    for (const [node, [state, cost, prev]] of Object.entries(entries)) {
      out[node] = { state, cost, prev };
    }
    return out;
  }

  const part2States = {
    start: makeState({
      A: ["settled", 0, "-"],
      C: ["open", 2, "A"],
      B: ["open", 4, "A"],
      D: ["open", 7, "A"],
      E: ["open", 6, "A"],
      F: ["unknown", null, "-"],
      G: ["unknown", null, "-"],
      K: ["unknown", null, "-"],
    }),
    afterC: makeState({
      A: ["settled", 0, "-"],
      C: ["settled", 2, "A"],
      B: ["open", 3, "C"],
      D: ["open", 5, "C"],
      E: ["open", 6, "A"],
      F: ["unknown", null, "-"],
      G: ["unknown", null, "-"],
      K: ["unknown", null, "-"],
    }),
    afterB: makeState({
      A: ["settled", 0, "-"],
      C: ["settled", 2, "A"],
      B: ["settled", 3, "C"],
      D: ["open", 5, "C"],
      E: ["open", 4, "B"],
      F: ["unknown", null, "-"],
      G: ["unknown", null, "-"],
      K: ["unknown", null, "-"],
    }),
    afterE: makeState({
      A: ["settled", 0, "-"],
      C: ["settled", 2, "A"],
      B: ["settled", 3, "C"],
      D: ["open", 5, "C"],
      E: ["settled", 4, "B"],
      F: ["open", 6, "E"],
      G: ["open", 9, "E"],
      K: ["unknown", null, "-"],
    }),
    afterD: makeState({
      A: ["settled", 0, "-"],
      C: ["settled", 2, "A"],
      B: ["settled", 3, "C"],
      D: ["settled", 5, "C"],
      E: ["settled", 4, "B"],
      F: ["open", 6, "E"],
      G: ["open", 9, "E"],
      K: ["unknown", null, "-"],
    }),
    afterF: makeState({
      A: ["settled", 0, "-"],
      C: ["settled", 2, "A"],
      B: ["settled", 3, "C"],
      D: ["settled", 5, "C"],
      E: ["settled", 4, "B"],
      F: ["settled", 6, "E"],
      G: ["open", 9, "E"],
      K: ["open", 10, "F"],
    }),
    afterG: makeState({
      A: ["settled", 0, "-"],
      C: ["settled", 2, "A"],
      B: ["settled", 3, "C"],
      D: ["settled", 5, "C"],
      E: ["settled", 4, "B"],
      F: ["settled", 6, "E"],
      G: ["settled", 9, "E"],
      K: ["open", 10, "F"],
    }),
    final: makeState({
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

  /* ================= Kịch bản 34 scene (text nguyên văn) ================= */

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
    },
    {
      tab: "Chốt C",
      kicker: "Mở thêm",
      title: "C làm rõ hơn",
      body: "Khi C được chốt, các cạnh từ C mở ra những đường mới đi qua C. Có đường còn rẻ hơn đường cũ.",
      audienceTitle: "Sau khi chốt C",
      audienceBullets: [
        "Cạnh C → B = 1 và C → D = 3 vừa mở ra các đường mới đi qua C.",
        "Cộng các cạnh đang thấy trên hình là ra tổng của từng đường.",
        "Ta lặp lại đúng câu hỏi: trong phần đang mở, đỉnh nào đã chắc chắn?",
      ],
      metricLabels: ["Vừa chốt", "Cập nhật", "Chọn tiếp"],
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
    },
    {
      tab: "Cost",
      kicker: "Bắt đầu",
      title: "Cần nhớ gì?",
      body: "Mỗi đỉnh cần một con số tạm thời: đường rẻ nhất hiện biết để tới nó. Vì xuất phát ở A nên A bắt đầu bằng 0, các đỉnh khác chưa biết.",
      audienceTitle: "Hai mảng đầu tiên",
      audienceBullets: ["Cost lưu con số tốt nhất hiện biết.", "Ban đầu chỉ có Cost[A] = 0."],
      metricLabels: ["Khởi tạo", "Cost", "Chưa biết"],
    },
    {
      tab: "Lặp",
      kicker: "Làm lại",
      title: "Lặp nhịp",
      body: "Nhịp chọn rồi mở này phải lặp đến khi chốt hết mọi đỉnh hoặc tìm được đích. Hai điều kiện dừng đó chưa biết viết thế nào, nên cứ while (true) rồi ghi tạm hai dòng dừng bằng lời, lát nữa sửa dần thành code thật.",
      audienceTitle: "Vòng lặp",
      audienceBullets: ["Mục tiêu: chốt hết hoặc tìm được đích.", "Ghi tạm hai điều kiện dừng bằng lời, sửa dần sau."],
      metricLabels: ["Nhịp", "while", "2 chỗ dừng tạm"],
    },
    {
      tab: "Min",
      kicker: "Quét vùng mở",
      title: "Chọn nhỏ nhất",
      body: "Bắt đầu sửa dòng tạm thứ nhất: thế nào là chốt hết? Là không còn chọn được đỉnh nào nữa — vậy phải viết đoạn chọn đỉnh trước đã. Ta duyệt từng đỉnh có Cost để giữ số nhỏ nhất, nhưng nếu chỉ nhìn số thì A = 0 sẽ thắng lại.",
      audienceTitle: "Tìm min",
      audienceBullets: ["Muốn biết khi nào chốt hết, phải viết đoạn chọn đỉnh trước.", "min giữ số rẻ nhất, nhưng chưa biết bỏ qua đỉnh đã xử lý."],
      metricLabels: ["Đang quét", "Nhỏ nhất", "Sẽ chốt"],
    },
    {
      tab: "Visited",
      kicker: "Không xét lại",
      title: "Nhớ đã chốt",
      body: "A vẫn có Cost 0, nhưng A không còn là ứng viên. Ta cần Visited như một cổng chặn: đã chốt thì không đi vào vòng chọn min nữa.",
      audienceTitle: "Visited",
      audienceBullets: ["Visited tách đã chốt khỏi đang mở.", "Khi quét min phải bỏ qua đỉnh đã chốt."],
      metricLabels: ["Đã chốt", "Visited", "bỏ qua"],
    },
    {
      tab: "Hết",
      kicker: "Sửa dòng tạm 1",
      title: "Không còn ứng viên",
      body: "Giờ trả lời được câu chốt hết khi nào: nếu cả lượt quét không có đỉnh nào lọt qua, min vẫn rỗng — tức là đã chốt hết. Dòng tạm chốt hết? được sửa thành điều kiện thật: min == null.",
      audienceTitle: "min rỗng",
      audienceBullets: ["min == null chính là chốt hết.", "Nó cũng xử lý bài toán đích không tới được."],
      metricLabels: ["Quét xong", "min = null", "break"],
    },
    {
      tab: "Đích",
      kicker: "Sửa dòng tạm 2",
      title: "Gặp K",
      body: "Còn dòng tạm tìm được đích: vì min là đỉnh sắp được chốt, nếu min chính là K thì ta đã có câu trả lời. Dòng tạm được sửa thành min == end.",
      audienceTitle: "Đích nhỏ nhất",
      audienceBullets: ["min == end chính là tìm được đích.", "K không cần bị đánh dấu Visited — ta đã có Cost[K]."],
      metricLabels: ["min", "K", "break"],
    },
    {
      tab: "Chốt",
      kicker: "Không phải đích",
      title: "Chốt min",
      body: "Nếu min không phải đích, ta chốt nó. C đang rẻ nhất trong các đỉnh đang mở, nên Cost[C] đã chắc và C được đưa vào Visited.",
      audienceTitle: "Chốt",
      audienceBullets: ["Visited[min] lưu việc này.", "Sau đó mới mở hàng xóm."],
      metricLabels: ["min", "C", "Visited"],
    },
    {
      tab: "Mở kề",
      kicker: "Sau khi chốt",
      title: "Thử hàng xóm",
      body: "Sau khi chốt C, mỗi cạnh đi ra từ C tạo một gói chi phí mới. Gói đó đi tới hàng xóm và thử thay Cost hiện tại.",
      audienceTitle: "Cập nhật thô",
      audienceBullets: ["newCost = Cost[min] + cost cạnh.", "Bản đầu tiên cứ gán thử Cost[ke]."],
      metricLabels: ["min = C", "newCost", "Cập nhật"],
    },
    {
      tab: "Rẻ hơn",
      kicker: "Sửa lỗi ghi đè",
      title: "Chỉ khi rẻ",
      body: "Cost của một đỉnh là số tốt nhất đang giữ. Nếu ô còn trống thì nhận số đầu tiên; nếu đã có số rồi thì ứng viên mới chỉ được ghi vào khi nó nhỏ hơn số đang giữ.",
      audienceTitle: "Điều kiện cập nhật",
      audienceBullets: [
        "Ô trống nghĩa là đỉnh chưa được mở, nên cost đầu tiên được nhận.",
        "Ô đã có số nghĩa là đã có một đường tới đó, nên không được ghi đè bằng số tệ hơn.",
      ],
      metricLabels: ["Đang thử", "Ứng viên", "Cost[F]"],
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
    },
    {
      tab: "Chạy lại",
      kicker: "Ghép lại",
      title: "Đọc lại code",
      body: "Bây giờ chạy lại code từ trạng thái trống: dòng nào mở Cost thì đỉnh đó hiện, vòng lặp tự tìm tới K, rồi dùng Prev để lần ngược ra đường.",
      audienceTitle: "Nhịp cuối cùng",
      audienceBullets: ["Tìm min.", "Dừng hoặc chốt.", "Mở kề và lưu Prev."],
      metricLabels: ["Mã giả", "Cost", "Prev"],
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
        "Vòng đó lặp nhiều lần, nên phần quét đỉnh tạo ra V × V.",
        "FOR 2: cộng thêm lượng cạnh kề được mở trong cả quá trình.",
      ],
      metricLabels: ["Vòng", "FOR 1", "FOR 2"],
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
    },
  ];

  const parts = [
    { id: "part1", label: "Phần 1", title: "Google Maps tìm đường như thế nào?", graph: "part1", scenes: part1Scenes },
    { id: "part2", label: "Phần 2", title: "Tư duy ngược tìm đường", graph: "part2", scenes: part2Scenes },
    { id: "part3", label: "Phần 3", title: "Từ ý tưởng thành mã giả", graph: "part2", scenes: part3Scenes },
    { id: "part4", label: "Phần 4", title: "Độ phức tạp và giới hạn", graph: "part2", scenes: part4Scenes },
  ];

  return {
    graphProfiles,
    demoScanRoutePaths,
    benchmarkPath,
    finalBestPath,
    part2NodeOrder,
    part2FinalPath,
    part2States,
    parts,
  };
})();

/* Registry cho enter functions — các file partN.js tự đăng ký */
DJ.enters = DJ.enters || {};
DJ.registerScene = function (partId, sceneIndex, enterFn) {
  DJ.enters[`${partId}:${sceneIndex}`] = enterFn;
};

/* Giá trị runtime điền vào {ROUTES} / {BENCH} (part1.js tính từ đồ thị) */
DJ.runtime = { routesTotal: 0, benchmarkCost: 0 };
DJ.fillText = function (text) {
  return String(text)
    .replaceAll("{ROUTES}", String(DJ.runtime.routesTotal))
    .replaceAll("{BENCH}", String(DJ.runtime.benchmarkCost));
};
