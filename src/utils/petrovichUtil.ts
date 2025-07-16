/**
 * Определяет пол по отчеству (если есть), иначе возвращает 'androgynous'.
 * @param user объект пользователя с полями firstName, lastName, patronymic, gender
 */
export function getNameGender(user: { patronymic?: string; gender?: string }): 'male' | 'female' | 'androgynous' {
  if (user.gender === 'male' || user.gender === 'female') return user.gender;
  if (user.patronymic) {
    const pat = user.patronymic.trim().toLowerCase();
    if (pat.endsWith('ич') || pat.endsWith('лы') || pat.endsWith('оглы')) return 'male';
    if (pat.endsWith('на') || pat.endsWith('зы')) return 'female';
  }
  return 'androgynous';
} 