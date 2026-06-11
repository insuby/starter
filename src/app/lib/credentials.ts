// Тестовые учётные записи для демонстрации входа по логину и паролю.
// По одной на каждый уровень доступа (роль/кабинет). Предназначены только для
// отладки и демонстрации — в продуктивной среде вход выполняется доменом (UAC),
// а проверку логина/пароля выполняет сервер. Здесь пароли захардкожены намеренно.

export interface TestAccount {
  userId: string;
  username: string;
  password: string;
}

export const testAccounts: TestAccount[] = [
  { userId: 'user4', username: 'center', password: 'center123' }, // Оператор центра
  { userId: 'user5', username: 'district', password: 'district123' }, // Оператор округа
  { userId: 'user6', username: 'omu', password: 'omu123' }, // Оператор субъекта (ОМУ)
  { userId: 'user7', username: 'subject', password: 'subject123' }, // Оператор субъекта (ВК субъект)
  { userId: 'user1', username: 'vkmo', password: 'vkmo123' }, // Оператор ВК МО
  { userId: 'user2', username: 'commissar', password: 'commissar123' }, // Военный комиссар
  { userId: 'user3', username: 'auditor', password: 'auditor123' }, // Аудитор
];

// Проверка пары логин/пароль. Логин нечувствителен к регистру и пробелам.
export function authenticate(username: string, password: string): string | null {
  const login = username.trim().toLowerCase();
  const match = testAccounts.find((a) => a.username === login && a.password === password);
  return match ? match.userId : null;
}

export function findAccountByUserId(userId: string): TestAccount | undefined {
  return testAccounts.find((a) => a.userId === userId);
}