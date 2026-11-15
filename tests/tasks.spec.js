const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:5500");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("задача отображается с выбранной темой", async ({ page }) => {
  await page.locator("#task-input").fill("Позвонить врачу");
  await page.getByText("Здоровье", { exact: true }).first().click();
  await page.getByRole("button", { name: "Добавить задачу" }).click();

  const task = page.locator(".task-item").filter({ hasText: "Позвонить врачу" });
  await expect(task.locator(".task-theme")).toHaveText("Здоровье");
  await expect(task.locator(".task-theme")).toHaveClass(/health/);
});

test("задача и тема сохраняются после перезагрузки", async ({ page }) => {
  await page.locator("#task-input").fill("Подготовить отчёт");
  await page.getByText("Работа", { exact: true }).first().click();
  await page.getByRole("button", { name: "Добавить задачу" }).click();

  await page.reload();

  const task = page.locator(".task-item").filter({ hasText: "Подготовить отчёт" });
  await expect(task.locator(".task-theme")).toHaveText("Работа");
  await expect(task.locator(".task-theme")).toHaveClass(/work/);
});

test("пустые задачи не добавляются, удаление не затрагивает остальные", async ({ page }) => {
  const addButton = page.getByRole("button", { name: "Добавить задачу" });

  await page.locator("#task-input").fill("   ");
  await addButton.click();
  await expect(page.locator(".task-item")).toHaveCount(0);

  await page.locator("#task-input").fill("Первая задача");
  await addButton.click();
  await page.locator("#task-input").fill("Вторая задача");
  await addButton.click();

  const firstTask = page.locator(".task-item").filter({ hasText: "Первая задача" });
  await firstTask.getByRole("button", { name: /Удалить задачу/ }).click();

  await expect(page.locator(".task-item")).toHaveCount(1);
  await expect(page.locator(".task-item")).toContainText("Вторая задача");
});