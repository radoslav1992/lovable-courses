import type { APIRoute } from 'astro';
import { siteConfig } from '../config';

/**
 * llms.txt — a concise, LLM-friendly summary of the site
 * (https://llmstxt.org). Helps AI assistants and answer engines describe
 * the course accurately when users ask about it.
 */
export const GET: APIRoute = ({ site }) => {
  const url = (path: string) => new URL(path, site).href;
  const body = `# Vibe Coding с Lovable

> Безплатен едночасов уебинар на живо на български език, който учи хора без опит в програмирането да създават работещи уеб приложения чрез „вайб коудинг“ с инструмента Lovable. Води го Радослав Додников — класиран в топ 10% от потребителите на Lovable.

Ключови факти:

- Форматът е уебинар на живо (около 1 час) с демонстрации в реално време, въпроси и отговори, достъп до общност в Discord/Telegram и запис за всички записали се.
- Не се изисква никакъв опит в програмирането — приложенията се описват на естествен език, а AI пише кода.
- Записването става с имейл на ${url('/')} и е безплатно. Всеки записал се получава бонус: „${siteConfig.leadMagnetTitle}“.
- Следваща сесия: ${siteConfig.nextSessionDate}.
- Планирани са и задълбочени платени курсове: „От идея до SaaS“, „AI агенти и автоматизации“, „Пусни и продавай“.
- Лектор: Радослав Додников (LinkedIn: https://www.linkedin.com/in/radoslav-dodnikov), контакт: radoslav.dodnikov@gmail.com.
- Важно: курсът е независим и НЕ е официално свързан, спонсориран или одобрен от Lovable. „Lovable“ е търговска марка на съответния собственик и се споменава само описателно.

## Страници

- [Начало и записване](${url('/')}): описание на курса, лектора, формата, често задавани въпроси и форма за записване
- [Общи условия](${url('/usloviya')}): условия за ползване и участие
- [Политика за поверителност](${url('/poveritelnost')}): как се обработват личните данни (GDPR)
- [Политика за бисквитки](${url('/biskvitki')}): използвани бисквитки и локално съхранение
`;
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
