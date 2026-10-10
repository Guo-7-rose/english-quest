import { beforeAll } from "vitest";
import { prepareData } from "./helpers/data";

// 所有测试文件统一：注入本地数据并让各数据层就绪（等价于线上「数据已加载」状态）
beforeAll(async () => {
  await prepareData();
});
