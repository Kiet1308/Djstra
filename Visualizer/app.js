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
      metricLabels: ["Đang nhìn", "So sánh", "Mục tiêu"],
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
        "Muốn chắc chắn đúng, cách này phải làm sáng hết 303 ô.",
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
        "Chỉ graph nhỏ này đã có 303 tuyến cần xét.",
      ],
      metricLabels: ["Số tuyến", "Việc phải làm", "Tốt nhất"],
      enter: enterSlowScene,
    },
    {
      tab: "Cắt nhánh",
      kicker: "Tối ưu đầu tiên",
      title: "Tệ hơn thì dừng",
      body: "Giả sử ta đã tìm được một đường tạm tốt có chi phí 36. Tuyến nào đang đi mà vượt 36 thì dừng ngay tại đó.",
      audienceTitle: "Quy tắc cắt nhánh",
      audienceBullets: [
        "Đường xanh là mốc tốt nhất hiện tại, chưa chắc là đáp án cuối.",
        "Khung trên bản đồ so sánh chi phí đang đi với mốc 36.",
        "Nét đứt đỏ là phần đường được bỏ qua, nhưng vẫn còn rất nhiều tuyến phải xét.",
      ],
      metricLabels: ["Ví dụ", "So sánh", "Mốc"],
      enter: enterPruneRuleScene,
    },
    {
      tab: "Áp dụng",
      kicker: "Sau khi có quy tắc",
      title: "Vẫn phải quét nhiều",
      body: "Bây giờ áp dụng quy tắc cắt nhánh cho toàn bộ 303 tuyến. Nhiều tuyến dừng sớm, nhưng ta vẫn phải xét từng tuyến.",
      audienceTitle: "Hiệu quả thật sự",
      audienceBullets: [
        "Đường xanh là mốc tốt nhất hiện tại, bắt đầu từ 36.",
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
      body: "Sang graph nhỏ hơn, mục tiêu là đi từ A đến K. Trước hết hãy nhìn từ K: K có thể đến từ đâu?",
      audienceTitle: "Đảo chiều câu hỏi",
      audienceBullets: [
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
      body: "Tìm đường ngắn nhất từ A tới từng đỉnh.",
      audienceTitle: "Bài toán mới",
      audienceBullets: [
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
      body: "Khi C được chốt, các cạnh từ C tạo ra chi phí mới rẻ hơn cho B và D.",
      audienceTitle: "Sau khi chốt C",
      audienceBullets: [
        "B giảm từ 4 xuống 3 nhờ đường A -> C -> B.",
        "D giảm từ 7 xuống 5 nhờ đường A -> C -> D.",
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
      body: "Ta chưa cần mã giả. Chỉ cần nắm được vì sao luôn lấy đỉnh đang mở có cost nhỏ nhất.",
      audienceTitle: "Ba bước cần nhớ",
      audienceBullets: [
        "Chọn đỉnh đang mở có cost nhỏ nhất.",
        "Chốt đỉnh đó vì không còn đường vòng nào rẻ hơn.",
        "Mở hàng xóm và cập nhật cost nếu tìm được đường tốt hơn.",
      ],
      metricLabels: ["Đường cuối", "Tổng cost", "Dừng ở ý tưởng"],
      enter: enterPart2IdeaScene,
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

  const el = {
    svg: document.getElementById("graphSvg"),
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
  let paused = false;
  let allRoutes = [];
  let exhaustiveRoutes = [];
  let pruningRoutes = [];
  let demoScanRoutes = [];
  let pathIndex = new Map();
  let adjacency = new Map();

  init();

  function init() {
    renderMapTexture();
    renderPartSwitcher();
    bindControls();
    switchPart(0, true);
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

  function getActiveScenes() {
    return getActivePart().scenes;
  }

  function renderPartSwitcher() {
    el.partSwitcher.innerHTML = "";
    parts.forEach((part, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "part-tab";
      button.textContent = part.label;
      button.addEventListener("click", () => switchPart(index));
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

  function switchPart(index, initial = false) {
    const nextIndex = Math.max(0, Math.min(parts.length - 1, index));
    if (!initial && nextIndex === currentPartIndex) return;
    currentPartIndex = nextIndex;
    currentScene = getActivePart().lastScene || 0;
    applyPartGraph(getActivePart());
    renderSceneTabs();
    updatePartHeader();
    setActivePartTab();
    loadScene(currentScene);
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
    el.prevButton.addEventListener("click", () => loadScene(Math.max(0, currentScene - 1)));
    el.nextButton.addEventListener("click", () => loadScene(Math.min(getActiveScenes().length - 1, currentScene + 1)));
    el.replayButton.addEventListener("click", () => loadScene(currentScene));
    el.pauseButton.addEventListener("click", togglePause);

    document.addEventListener("keydown", (event) => {
      const tag = event.target && event.target.tagName;
      if (tag === "BUTTON") return;

      if (event.key === "ArrowRight" || event.key === " ") {
        event.preventDefault();
        loadScene(Math.min(getActiveScenes().length - 1, currentScene + 1));
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        loadScene(Math.max(0, currentScene - 1));
      }

      if (event.key.toLowerCase() === "r") {
        loadScene(currentScene);
      }

      if (event.key.toLowerCase() === "p") {
        togglePause();
      }
    });
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
    if (activeTimeline) activeTimeline.kill();
    if (activeRouteTween) activeRouteTween.kill();
    if (ghostRouteTween) ghostRouteTween.kill();
    gsap.killTweensOf("*");
    activeRouteTween = null;
    ghostRouteTween = null;
    activeNodeClickHandler = null;
    clearLayer(el.routeCloud);
    clearLayer(el.activeRouteLayer);
    clearLayer(el.cutLayer);
    clearAnnotations();
    bestRouteElement = null;
    el.comparisonPanel.setAttribute("aria-hidden", "true");
    hidePruneLens();
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

  function setSceneCopy(scene) {
    el.sceneKicker.textContent = scene.kicker;
    el.sceneTitle.textContent = scene.title;
    el.sceneBody.textContent = scene.body;
    setMetricLabels(scene.metricLabels);
    el.audienceTitle.textContent = scene.audienceTitle;
    el.audienceBullets.innerHTML = "";
    scene.audienceBullets.forEach((bullet) => {
      const li = document.createElement("li");
      li.textContent = bullet;
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
    el.prevButton.disabled = currentScene === 0;
    el.nextButton.disabled = currentScene === scenes.length - 1;
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
    el.workbench.classList.remove("is-quiz", "is-action");
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
      if (getActivePart().id !== "part2") return;

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
      if (getActivePart().id !== "part2") return;

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
      } else if (getActivePart().id === "part2" && !context.has(id) && !target.has(id)) {
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
      div.className = `state-row is-${row.status}${showPrev ? "" : " no-prev"}${showCosts ? "" : " no-cost"}${focus.has(node) ? " is-focus" : ""}`;
      div.dataset.node = node;

      const label = document.createElement("strong");
      label.textContent = node;
      const cost = document.createElement("span");
      cost.className = "state-cost";
      cost.textContent = row.cost == null ? "?" : showCosts || row.status === "settled" ? String(row.cost) : "ẩn";
      const status = document.createElement("span");
      status.textContent = statusText[row.status];
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
    el.workbench.classList.remove("is-quiz", "is-action");
    el.workbench.classList.add(mode);
    el.workloadGrid.innerHTML = "";
  }

  function setupCandidateQuiz({ candidates, answer, title, status, candidateMeta = {}, onCorrect, onWrong }) {
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

    function choose(node) {
      if (completed) return;
      const button = el.workloadGrid.querySelector(`[data-node="${node}"]`);
      if (node === answer) {
        completed = true;
        activeNodeClickHandler = null;
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
    button.addEventListener("click", () => {
      button.disabled = true;
      onClick();
    });
    el.workloadGrid.appendChild(button);
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
    el.cutLayer.appendChild(group);
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
        if (group.parentNode === el.cutLayer) group.remove();
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
    ghostRouteTween.to(group, { opacity: 0, duration: dur(0.34), ease: "power2.in" }, "+=2.35");
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
      "F = min(tốt E + 2, tốt D + 2)    G = min(tốt E + 5, tốt D + 7)",
      "D/E lại hỏi tiếp về A/B/C; vậy ta phải xây từ A lên.",
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
    drawTraceStepCard(step);
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
    tl.fromTo(el.annotationLayer.children, { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: dur(0.42), ease: "power3.out" }, "<0.12");
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
      { center: { x: 340, y: 368 }, scale: 1.52 },
      { center: { x: 214, y: 332 }, scale: 1.62 },
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
    tl.fromTo(el.annotationLayer.children, { y: -12, opacity: 0 }, { y: 0, opacity: 1, duration: dur(0.42), ease: "power3.out" }, annotationAt);
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
    tl.call(() => setMetrics("A mở 4", "chưa chốt", "suy tiếp"), [], 1.72);
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
        C: "cost 2",
        B: "cost 4",
        D: "cost 7",
        E: "cost 6",
      },
      onWrong: (node) => {
        const info = wrongInfo[node];
        if (!info) return;
        clearAnnotations();
        animateCameraTo(part2Cameras.frontier, 0.44);
        setNodeStates(state, { focus: candidates, wrong: [node], clickable: candidates });
        renderDijkstraTable(state, { focus: [node, "C"] });
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
        renderDijkstraTable(part2States.afterC, { focus: ["C", "B", "D"] });
        showBestRoute(["A", "C"]);
        setMetrics("chốt C", "vòng >= 4", "C chắc");
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
    renderDijkstraTable(part2States.afterC, { focus: candidates });
    showBestRoute(["A", "C"]);
    el.metricStrip.classList.add("is-hidden");
    clearAnnotations();
    setMetrics("C đã chốt", "B=3, D=5, E=6", "hãy chọn tiếp");

    setupCandidateQuiz({
      candidates,
      answer: "B",
      title: "Bây giờ chốt ai?",
      status: "B/D/E",
      candidateMeta: {
        B: "cost 3",
        D: "cost 5",
        E: "cost 6",
      },
      onWrong: (node) => {
        const info = wrongInfo[node];
        if (!info) return;
        clearAnnotations();
        animateCameraTo(part2Cameras.frontier, 0.44);
        setNodeStates(part2States.afterC, { focus: ["B", node], wrong: [node], clickable: candidates });
        renderDijkstraTable(part2States.afterC, { focus: ["B", node] });
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
        renderDijkstraTable(part2States.afterB, { focus: ["B", "E"] });
        showBestRoute(["A", "C", "B"]);
        setMetrics("chốt B", "E=4 qua B", "tiếp theo E");
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

    showPart2Workbench("Chạy tiếp", "Chọn nhỏ nhất, chốt, mở hàng xóm", "4 bước", "is-action");
    ["D", "F", "G", "K"].forEach((node) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "candidate-button";
      chip.disabled = true;
      chip.textContent = node;
      el.workloadGrid.appendChild(chip);
    });

    setCameraView(part2Cameras.middle);
    setEdgeStates({ visible: baseVisible, focus: [part2Edges.fromE], locked: [baseLocked] });
    setNodeStates(part2States.afterE, { focus: ["D", "F", "G"], showNodeCosts: true });
    renderDijkstraTable(part2States.afterE, { focus: ["D", "F", "G"] });
    showBestRoute(["A", "C", "B", "E"]);
    setMetrics("sau E", "D=5, F=6, G=9", "lấy D");

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

    tl.fromTo(".stage-copy", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: dur(0.55), ease: "power3.out" });
    steps.forEach((step, index) => {
      tl.to({}, { duration: dur(index === 0 ? 0.42 : 0.62) });
      tl.call(() => {
        setEdgeStates({ visible: step.visible, focus: step.edgeFocus, locked: step.locked });
        setNodeStates(step.state, { focus: step.focus, correct: [step.node], showNodeCosts: true });
        renderDijkstraTable(step.state, { focus: step.focus });
        showBestRoute(step.route);
        setMetrics(step.metrics[0], step.metrics[1], step.metrics[2]);
        const chip = el.workloadGrid.children[index];
        if (chip) chip.classList.add("is-correct");
      });
      if (step.camera) moveCameraOnTimeline(tl, step.camera.center, step.camera.scale, "<");
    });
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
      { label: "Chọn nhỏ nhất", value: "1", body: "Luôn lấy đỉnh đang mở có cost nhỏ nhất.", tone: "" },
      { label: "Chốt", value: "2", body: "Khi đã chốt, cost của đỉnh đó không đổi nữa.", tone: "better" },
      { label: "Mở hàng xóm", value: "3", body: "Cập nhật cost nếu đường mới rẻ hơn.", tone: "next" },
    ]);
    el.comparisonPanel.setAttribute("aria-hidden", "false");

    tl.fromTo(".stage-copy", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: dur(0.55), ease: "power3.out" });
    tl.fromTo(".comparison-col", { y: 22, opacity: 0 }, { y: 0, opacity: 1, stagger: dur(0.12), duration: dur(0.55), ease: "power3.out" }, "<0.1");
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

    setMetrics("3 tuyến ví dụ", "36/22/16", "nhỏ nhất");
    renderRouteList(sampleRoutes, { bestIndex: 2 });

    tl.fromTo(".stage-copy", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: dur(0.65), ease: "power3.out" });
    tl.fromTo(".node-group", { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, stagger: dur(0.035), duration: dur(0.45), ease: "back.out(1.6)" }, "<0.08");
    routeEls.forEach((path, index) => {
      animatePathOnTimeline(tl, path, index === 2 ? 0.7 : 0.44, index === 2 ? "<0.1" : "<0.05");
    });
    tl.call(() => setMetrics("3 tuyến ví dụ", "36/22/16", "chi phí nhỏ nhất"));
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

    showWorkbench("Vét cạn", "303 tuyến phải đi tới B", `0/${totalRoutes}`, false);
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
      animatePathOnTimeline(tl, routeEl, 0.44, undefined, 0.026);
      tl.to(routeEl, { opacity: 0, duration: dur(0.012), ease: "power2.out" });
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
    showWorkbench("Cắt nhánh", "Cùng 303 tuyến, dừng sớm nhiều tuyến", `0/${totalRoutes}`, true);
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
      animatePathOnTimeline(tl, partialEl, info.pruned ? 0.56 : 0.32, undefined, index < 8 ? 0.08 : 0.02);
      if (remainingEl) {
        tl.to(remainingEl, { opacity: index < 8 ? 0.58 : 0.38, duration: dur(index < 8 ? 0.08 : 0.015), ease: "power2.out" }, "<0.02");
        tl.to(remainingEl, { opacity: 0, duration: dur(index < 8 ? 0.08 : 0.012), ease: "power2.out" });
      }
      tl.to(partialEl, { opacity: 0, duration: dur(index < 8 ? 0.035 : 0.012), ease: "power2.out" }, remainingEl ? "<" : undefined);
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
      activeTimeline.resume();
      if (activeRouteTween) activeRouteTween.resume();
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
    if (getActivePart().id === "part2" && part2EdgeLabelPlacements[key]) {
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
