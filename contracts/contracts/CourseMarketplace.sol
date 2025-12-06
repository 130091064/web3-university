// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CourseMarketplace {
    struct Course {
        uint256 id;
        address author;
        uint256 price; // 以 YD 最小单位计价
        string metadataURI; // 课程详情的 URL/IPFS
        bool isActive;
        uint256 studentCount; // ⭐ 已购买人数（包含作者自己）
        uint64 createdAt; // ⭐ 创建时间戳
    }

    IERC20 public immutable ydToken;
    address public owner;

    uint256 public nextCourseId;
    mapping(uint256 => Course) public courses;

    // user => courseId => purchased?
    mapping(address => mapping(uint256 => bool)) public purchased;

    // ⭐ 新增：用户已购课程索引（核心）
    // user => 该用户买过的所有课程 id 列表
    mapping(address => uint256[]) private _purchasedCourseIds;

    event CourseCreated(
        uint256 indexed id,
        address indexed author,
        uint256 price,
        string metadataURI
    );

    event CourseUpdated(uint256 indexed id, uint256 price, bool isActive);

    event CoursePurchased(
        uint256 indexed id,
        address indexed buyer,
        uint256 price
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyAuthor(uint256 courseId) {
        require(courses[courseId].author == msg.sender, "Not author");
        _;
    }

    constructor(address _ydToken) {
        require(_ydToken != address(0), "YD token address required");
        ydToken = IERC20(_ydToken);
        owner = msg.sender;
    }

    // 作者创建课程
    function createCourse(
        uint256 price,
        string calldata metadataURI
    ) external returns (uint256) {
        require(price > 0, "Price must be > 0");
        require(bytes(metadataURI).length > 0, "Metadata URI required");

        uint256 courseId = ++nextCourseId;

        courses[courseId] = Course({
            id: courseId,
            author: msg.sender,
            price: price,
            metadataURI: metadataURI,
            isActive: true,
            studentCount: 1, // ⭐ 作者默认算一个学员
            createdAt: uint64(block.timestamp)
        });

        // ⭐ 作者创建课程时，自动视为已购买
        purchased[msg.sender][courseId] = true;

        // ⭐ 新增：把课程 id 记录到作者自己的“已购课程列表”中
        _purchasedCourseIds[msg.sender].push(courseId);

        emit CourseCreated(courseId, msg.sender, price, metadataURI);
        return courseId;
    }

    // 作者调整价格 / 上下架
    function updateCourse(
        uint256 courseId,
        uint256 newPrice,
        bool newActive
    ) external onlyAuthor(courseId) {
        require(newPrice > 0, "Price must be > 0");

        Course storage c = courses[courseId];
        c.price = newPrice;
        c.isActive = newActive;

        emit CourseUpdated(courseId, newPrice, newActive);
    }

    // 用户用 YD 购买课程
    function buyCourse(uint256 courseId) external {
        Course storage c = courses[courseId];
        require(c.id != 0, "Course not found");
        require(c.isActive, "Course not active");
        require(!purchased[msg.sender][courseId], "Already purchased");

        // ⭐ 作者不能再购买自己的课程（前端可据此隐藏按钮）
        require(msg.sender != c.author, "Author cannot buy own course");

        // 从用户钱包把 YD 转给作者
        bool ok = ydToken.transferFrom(msg.sender, c.author, c.price);
        require(ok, "YD transfer failed");

        // 标记已购买
        purchased[msg.sender][courseId] = true;

        // ⭐ 新增：把课程 id 记录到该用户的“已购课程列表”中
        _purchasedCourseIds[msg.sender].push(courseId);

        // 学员数 +1
        c.studentCount += 1;

        emit CoursePurchased(courseId, msg.sender, c.price);
    }

    // 查询某人是否已购买某课程（前端会用）
    function hasPurchased(
        address user,
        uint256 courseId
    ) external view returns (bool) {
        return purchased[user][courseId];
    }

    // 获取课程详情（前端列表用）
    function getCourse(uint256 courseId) external view returns (Course memory) {
        require(courses[courseId].id != 0, "Course not found");
        return courses[courseId];
    }

    // ⭐ 新增：按用户地址查询该用户买过的所有课程 id
    function getPurchasedCourseIds(
        address user
    ) external view returns (uint256[] memory) {
        return _purchasedCourseIds[user];
    }
}
