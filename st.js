// 1. 获取所有菜单项和内容区块
const menuItems = document.querySelectorAll('.sidebar li');
const contentSections = document.querySelectorAll('.content-section');

// 2. 给每个菜单项绑定点击事件
menuItems.forEach((item) => {
	item.addEventListener('click', () => {
		// 🔵 步骤1：移除所有菜单项的「激活态」样式
		menuItems.forEach((i) => i.classList.remove('active'));
		// 🔵 步骤2：给当前点击的菜单项添加「激活态」样式
		item.classList.add('active');

		// 🔵 步骤3：获取当前菜单项对应的「数据目标」（即右侧内容区的 ID）
		const targetId = item.getAttribute('data-target');
		// 🔵 步骤4：找到目标内容区块
		const targetSection = document.getElementById(targetId);

		// 🔵 步骤5：触发所有内容区块的「离开动画」
		contentSections.forEach((sec) => {
			sec.classList.remove('enter-active'); // 移除「进入」类
			sec.classList.add('leave-active');    // 添加「离开」类
		});

		// 🔵 步骤6：动画结束后，显示目标内容并触发「进入动画」
		// （延时时长 = 离开动画的 duration → 0.4s → 400ms）
		setTimeout(() => {
			contentSections.forEach(sec => {
				sec.classList.remove('leave-active') // 移除「离场」类
				sec.style.display = 'none'             // 隐藏其他内容区
			})
			targetSection.style.display = 'block'  // 显示目标内容区
			targetSection.classList.add('enter-active') // 触发「入场」动画
		}, 400);
	});
});