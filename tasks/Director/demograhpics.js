export default [
	{ type: "radiogroup", name: "gender", colCount: 0, isRequired: true, title: "您的性别是?", choices: ["男性", "女性", "其他", "不愿透露"] },
	{ type: "radiogroup", name: "native", colCount: 0, isRequired: true, title: "您的母语是否是中文？", choices: ["是", "否"] },
	{ type: "text", name: "native language", visibleIf: "{native}='No'", title: "您的母语是:" },
	{ type: "text", name: "languages", title: "您是否会说其他语言?" },
	{ type: "text", name: "age", title: "您的年龄是?", width: "auto" },
	{ type: "radiogroup", name: "degree", isRequired: true, title: "您的最高学历是？如果您的学业正在进行中，请选择已经得到的最高学历。", choices: ["低于高中毕业", "高中毕业", "大学结业（无毕业证书）","本科毕业", "硕士毕业", "博士毕业", "不愿透露"] },
	{ type: "text", name: "comments", isRequired: false, title: "如果您有任何意见，请在此处留言" },
];