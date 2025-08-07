import '@devnomic/marquee/dist/index.css';
import 'slick-carousel/slick/slick-theme.css';
import 'slick-carousel/slick/slick.css';

import { Marquee } from '@devnomic/marquee';

import type { FC } from 'react';
import Slider from 'react-slick';

import cvoData from './data/cvo.json';

type Commissioner = {
  position: string;
  rank: string;
  fio: string;
  birthdate: string;
  last_position: {
    date_1: number;
    date_2: number;
    title: string;
  };
  medals: string[];
  achievement: string[];
  photo: string;
  gerb: string;
  flag: string;
};

const App: FC = () => {
  const commissioners = cvoData as unknown as Commissioner[];

  const createCommissionerPairs = () => {
    const pairs = [];
    for (let i = 0; i < commissioners.length; i += 2) {
      const pair = [commissioners[i]];
      if (i + 1 < commissioners.length) {
        pair.push(commissioners[i + 1]);
      }
      pairs.push(pair);
    }
    return pairs;
  };

  const commissionerPairs = createCommissionerPairs();

  const verticalSliderSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    arrows: false,
    vertical: true,
    verticalSwiping: true,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
  };

  const malakhovskyDescription = [
    'Генерал-майор, Первый военный комиссар Латвийской СССР в составе 2-го Прибалтийского фронта. Первый военный комиссар Калининградской области (1946- 1948). В короткие сроки создал военные комиссариаты в области и организовал их работу. За время службы был пять раз ранен и два раза контужен (одна контузия - в результате падения с подбитого аэроплана).',
    'Участник Первой мировой войны, Георгиевский кавалер, ефрейтор в императорской армии, командир стрелкового полка, стрелковой и кавалерийской бригад, кавалерийской дивизии Красной Армии в Гражданскую войну, участник Великой Отечественной войны. Военный комиссар Керченского и Ново-Ушицкого уездов, райвоенкоматов Феодосии, Николаева, Житомира, Чернигова, офицер организационно-мобильных отделов Киевского особого и Прибалтийского военных округов, начальник отдела укомплектования 7 отдельной армии Ленинградского округа (фронта), военный комиссар Латвийской ССР и Калининградской области.',
    'С началом Великой Отечественной войны, в короткие сроки сформировал и укомплектовал воинские части на направлении прорыва белофинов в районе Лайомола. Был назначен военным комендантом Петрозаводска. Организовал оборону города и лично руководил боем воинских частей гарнизона с противником, под обстрелом противника провел эвакуацию предприятий и населения.',
    'Его имя носили пять совхозов и колхозов Воронежской области. Улицы и площади названы в честь Малаховского В.А. в городах Воронеже, Богучаре, Калаче, Острогожске, и др.',
    'Дополнительная информация о достижениях и вкладе в развитие военного дела. Его опыт и знания были востребованы на протяжении всей карьеры.',
    'Валентин Александрович Малаховский оставил значительный след в истории военного комиссариата и внес большой вклад в развитие военного дела в СССР.',
    'Его военная карьера началась в императорской армии, где он проявил себя как талантливый командир. В годы Гражданской войны он командовал различными подразделениями Красной Армии.',
    'В период Великой Отечественной войны Малаховский проявил исключительное мужество и организаторские способности. Он лично участвовал в боях и руководил обороной важных стратегических объектов.',
    'После войны Валентин Александрович продолжил службу в военных комиссариатах, где внес значительный вклад в развитие системы военного управления и подготовки кадров.',
    'Его имя стало символом воинской доблести и преданности Родине. Многие улицы, площади и учреждения названы в его честь в различных городах России.',
  ];

  return (
    <div className="mx-auto flex h-screen w-[720px] flex-col overflow-hidden bg-[lightblue]">
      <div className="flex size-full flex-col gap-[100px]">
        <div className="flex h-[35%] items-center justify-center p-5">
          <div className="flex size-full gap-8 text-white">
            <div className="flex w-48 shrink-0 items-start justify-center">
              <div className="flex h-56 w-44 items-center justify-center rounded-lg border-3 border-white bg-gradient-to-br from-gray-300 to-gray-200 text-5xl font-bold text-gray-600">
                Ф
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto pr-3">
              <h2 className="m-0 text-2xl font-bold uppercase tracking-wider text-yellow-400 drop-shadow-lg">
                ВОЕННЫЙ КОМИССАР
              </h2>
              <p className="m-0 text-base font-medium text-white opacity-90">
                Латвийской СССР (1943-1946)
              </p>
              <p className="m-0 text-base font-medium text-white opacity-90">
                Калининградской области (1946-1948)
              </p>

              <h1 className="m-0 text-3xl font-bold uppercase leading-tight tracking-wide text-white drop-shadow-lg">
                ВАЛЕНТИН АЛЕКСАНДРОВИЧ МАЛАХОВСКИЙ
              </h1>
              <p className="m-0 text-lg font-semibold text-yellow-400 drop-shadow">
                (1894-1971)
              </p>

              <div className="flex-1 overflow-hidden">
                <Marquee
                  direction="up"
                  className="h-full"
                  fade
                  numberOfCopies={3}
                >
                  {malakhovskyDescription.map((paragraph, index) => (
                    <div key={index} className="mb-2">
                      <p className="m-0 text-justify text-sm leading-tight text-white">
                        {paragraph}
                      </p>
                    </div>
                  ))}
                </Marquee>
              </div>
            </div>
          </div>
        </div>

        <div className="relative h-[65%] overflow-hidden">
          <Marquee
            direction="up"
            className="slow-marquee h-full !gap-1"
            innerClassName="h-full slow-marquee !gap-1"
            fade
            numberOfCopies={5}
          >
            {commissionerPairs.map((pair, pairIndex) => (
              <div
                key={pairIndex}
                className="mb-[0.1rem] flex justify-center gap-1"
              >
                {pair.length === 1 ? (
                  <div className="mx-auto flex h-96 max-w-[340px] flex-1 flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-lg">
                    <div className="mb-3 flex h-96 shrink-0 items-start gap-4">
                      <div className="w-15 overflow-hidden rounded-full border-2 border-blue-500">
                        <img
                          src={`/images/${pair[0].photo}`}
                          alt={`Фото ${pair[0].fio}`}
                          className="size-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const names = pair[0].fio.split(' ');
                            const lastName = names[0];
                            const firstName = names[1] || '';
                            const middleName = names[2] || '';
                            target.parentElement!.innerHTML =
                              '<div class="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 text-xs font-bold text-white">' +
                              '<div>' +
                              lastName +
                              '</div>' +
                              '<div>' +
                              firstName +
                              ' ' +
                              middleName +
                              '</div>' +
                              '</div>';
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="m-0 w-10/12 text-base font-semibold text-gray-800">
                          {/* Герб и флаг */}
                          <div className="absolute right-0 top-0 flex flex-col items-center gap-2">
                            <div className="h-6 w-12 overflow-hidden">
                              <img
                                src={`/images/${pair[0].flag}`}
                                alt={`Флаг ${pair[0].fio}`}
                                className="size-full object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            </div>
                            <div className="size-8 overflow-hidden">
                              <img
                                src={`/images/${pair[0].gerb}`}
                                alt={`Герб ${pair[0].fio}`}
                                className="size-full object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black">
                              {pair[0].fio.split(' ')[0]}
                            </span>
                            <span className="text-[10px]">
                              {pair[0].fio.split(' ').slice(1).join(' ')}
                            </span>
                          </div>
                        </h4>
                        <p className="m-0 text-sm font-medium text-gray-500">
                          {pair[0].rank}
                        </p>
                        <p className="m-0 text-sm leading-none text-gray-700">
                          {pair[0].position}
                        </p>
                        <p className="m-0 text-xs text-gray-400">
                          {pair[0].birthdate}
                        </p>
                      </div>
                    </div>

                    <div className="flex min-h-0 flex-1 flex-col">
                      <div className="shrink-0">
                        <h5 className="m-0 mb-1 border-b-2 border-blue-500 pb-1 text-sm font-semibold text-gray-800">
                          Последняя должность:
                        </h5>
                        <p className="m-0 text-sm leading-none text-gray-700">
                          {pair[0].last_position.title}
                        </p>
                        <p className="m-0 text-xs italic text-gray-500">
                          {pair[0].last_position.date_1} -{' '}
                          {pair[0].last_position.date_2}
                        </p>
                      </div>

                      <div className="min-h-0 flex-1 overflow-hidden">
                        <div className="flex h-full flex-col gap-2">
                          {pair[0].medals?.length > 0 && (
                            <div className="flex-1">
                              <h5 className="m-0 mb-1 border-b-2 border-blue-500 pb-1 text-sm font-semibold text-gray-800">
                                Награды:
                              </h5>
                              <div className="h-12 overflow-hidden">
                                <Slider {...verticalSliderSettings}>
                                  {pair[0].medals.map((medal, medalIndex) => (
                                    <div key={medalIndex}>
                                      <p className="m-0 text-xs leading-none text-gray-700">
                                        {medal}
                                      </p>
                                    </div>
                                  ))}
                                </Slider>
                              </div>
                            </div>
                          )}

                          {pair[0].achievement?.length > 0 && (
                            <div className="flex-1">
                              <h5 className="m-0 mb-1 border-b-2 border-blue-500 pb-1 text-sm font-semibold text-gray-800">
                                Достижения:
                              </h5>
                              <div className="h-12 overflow-hidden">
                                <Slider {...verticalSliderSettings}>
                                  {pair[0].achievement.map(
                                    (achievement, achievementIndex) => (
                                      <div key={achievementIndex}>
                                        <p className="m-0 text-xs leading-none text-gray-700">
                                          {achievement}
                                        </p>
                                      </div>
                                    ),
                                  )}
                                </Slider>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  pair.map((commissioner, index) => (
                    <div
                      key={index}
                      className="flex max-w-[340px] flex-1 flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-lg"
                    >
                      <div className="mb-2 flex h-40 shrink-0 items-start gap-2 overflow-hidden">
                        <div className="w-28 overflow-hidden rounded">
                          <img
                            src={`/images/${commissioner.photo}`}
                            alt={`Фото ${commissioner.fio}`}
                            className="size-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const names = commissioner.fio.split(' ');
                              const lastName = names[0];
                              const firstName = names[1] || '';
                              const middleName = names[2] || '';
                              target.parentElement!.innerHTML =
                                '<div class="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 text-xs font-bold text-white">' +
                                '<div>' +
                                lastName +
                                '</div>' +
                                '<div>' +
                                firstName +
                                ' ' +
                                middleName +
                                '</div>' +
                                '</div>';
                            }}
                          />
                        </div>

                        <div className="relative flex-1">
                          {/* Герб и флаг */}
                          <div className="absolute right-0 top-0 flex flex-col items-center gap-2">
                            <div className="h-6 w-12 overflow-hidden">
                              <img
                                src={`/images/${commissioner.flag}`}
                                alt={`Флаг ${commissioner.fio}`}
                                className="size-full object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            </div>
                            <div className="size-8 overflow-hidden">
                              <img
                                src={`/images/${commissioner.gerb}`}
                                alt={`Герб ${commissioner.fio}`}
                                className="size-full object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            </div>
                          </div>

                          <h4 className="m-0 w-10/12 text-base font-semibold text-gray-800">
                            {/* Герб и флаг */}
                            <div className="absolute right-0 top-0 flex flex-col items-center gap-2">
                              <div className="h-6 w-12 overflow-hidden">
                                <img
                                  src={`/images/${commissioner.flag}`}
                                  alt={`Флаг ${commissioner.fio}`}
                                  className="size-full object-contain"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              </div>
                              <div className="size-8 overflow-hidden">
                                <img
                                  src={`/images/${commissioner.gerb}`}
                                  alt={`Герб ${commissioner.fio}`}
                                  className="size-full object-contain"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              </div>
                            </div>
                            <div className="flex flex-col">
                              <span className="font-black">
                                {pair[0].fio.split(' ')[0]}
                              </span>
                              <span className="text-[10px]">
                                {pair[0].fio.split(' ').slice(1).join(' ')}
                              </span>
                            </div>
                          </h4>
                          <p className="m-0 text-sm font-medium text-gray-500">
                            {commissioner.rank}
                          </p>
                          <p className="m-0 text-sm leading-none text-gray-700">
                            {commissioner.position}
                          </p>
                          <p className="m-0 text-xs text-gray-400">
                            {commissioner.birthdate}
                          </p>
                        </div>
                      </div>

                      <div className="flex min-h-0 flex-1 flex-col">
                        <div className="mb-2 shrink-0">
                          <h5 className="m-0 mb-1 border-b-2 border-blue-500 pb-1 text-sm font-semibold text-gray-800">
                            Последняя должность:
                          </h5>
                          <p className="m-0 text-sm leading-none text-gray-700">
                            {commissioner.last_position.title}
                          </p>
                          <p className="m-0 text-xs italic text-gray-500">
                            {commissioner.last_position.date_1} -{' '}
                            {commissioner.last_position.date_2}
                          </p>
                        </div>

                        <div className="min-h-0 flex-1 overflow-hidden">
                          <div className="flex h-full flex-col gap-2">
                            {commissioner.medals?.length > 0 && (
                              <div className="flex-1">
                                <h5 className="m-0 mb-1 border-b-2 border-blue-500 pb-1 text-sm font-semibold text-gray-800">
                                  Награды:
                                </h5>
                                <div className="h-12 overflow-hidden">
                                  <Slider {...verticalSliderSettings}>
                                    {commissioner.medals.map(
                                      (medal, medalIndex) => (
                                        <div key={medalIndex}>
                                          <p className="m-0 text-xs leading-none text-gray-700">
                                            {medal}
                                          </p>
                                        </div>
                                      ),
                                    )}
                                  </Slider>
                                </div>
                              </div>
                            )}

                            {commissioner.achievement?.length > 0 && (
                              <div className="flex-1">
                                <h5 className="m-0 mb-1 border-b-2 border-blue-500 pb-1 text-sm font-semibold text-gray-800">
                                  Достижения:
                                </h5>
                                <div className="h-12 overflow-hidden">
                                  <Slider {...verticalSliderSettings}>
                                    {commissioner.achievement.map(
                                      (achievement, achievementIndex) => (
                                        <div key={achievementIndex}>
                                          <p className="m-0 text-xs leading-none text-gray-700">
                                            {achievement}
                                          </p>
                                        </div>
                                      ),
                                    )}
                                  </Slider>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ))}
          </Marquee>
        </div>
      </div>
    </div>
  );
};

export default App;
