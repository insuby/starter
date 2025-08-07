import './styles/main.scss';
import 'slick-carousel/slick/slick-theme.css';
import 'slick-carousel/slick/slick.css';

import { Marquee } from '@devnomic/marquee';

import type { FC } from 'react';
import { useEffect, useRef, useState } from 'react';
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

const App = () => {
  const commissioners = cvoData as unknown as Commissioner[];
  const sliderRef = useRef<Slider>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [textScrolled, setTextScrolled] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

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

  const horizontalSliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    autoplay: false,
    pauseOnHover: false,
    beforeChange: (oldIndex: number, newIndex: number) => {
      setCurrentSlide(newIndex);
      setTextScrolled(false);
    },
  };

  const featuredCommissioners = [
    {
      fio: 'ВАЛЕНТИН АЛЕКСАНДРОВИЧ МАЛАХОВСКИЙ',
      birthdate: '(1894-1971)',
      position: 'ВОЕННЫЙ КОМИССАР',
      region:
        'Латвийской СССР (1943-1946)\nКалининградской области (1946-1948)',
      description: `
        Генерал-майор, Первый военный комиссар Латвийской СССР в составе 2-го Прибалтийского фронта. Первый военный комиссар Калининградской области (1946- 1948). В короткие сроки создал военные комиссариаты в области и организовал их работу. За время службы был пять раз ранен и два раза контужен (одна контузия - в результате падения с подбитого аэроплана).
        Участник Первой мировой войны, Георгиевский кавалер, ефрейтор в императорской армии, командир стрелкового полка, стрелковой и кавалерийской бригад, кавалерийской дивизии Красной Армии в Гражданскую войну, участник Великой Отечественной войны. Военный комиссар Керченского и Ново-Ушицкого уездов, райвоенкоматов Феодосии, Николаева, Житомира, Чернигова, офицер организационно-мобильных отделов Киевского особого и Прибалтийского военных округов, начальник отдела укомплектования 7 отдельной армии Ленинградского округа (фронта), военный комиссар Латвийской ССР и Калининградской области.
        С началом Великой Отечественной войны, в короткие сроки сформировал и укомплектовал воинские части на направлении прорыва белофинов в районе Лайомола. Был назначен военным комендантом Петрозаводска. Организовал оборону города и лично руководил боем воинских частей гарнизона с противником, под обстрелом противника провел эвакуацию предприятий и населения.
        Его имя носили пять совхозов и колхозов Воронежской области. Улицы и площади названы в честь Малаховского В.А. в городах Воронеже, Богучаре, Калаче, Острогожске, и др`,
      photo: 'main/малаховский.png',
    },
    {
      fio: 'Иван Васильевич Панфилов',
      birthdate: '(1893-1941)',
      position: 'ВОЕННЫЙ КОМИССАР',
      region: 'Киргизской ССР (1938-1941)',
      description: `Генерал-майор, Герой Советского Союза, военный комиссар Киргизской, участник Первой мировой войны, фельдфебель императорской армии, в Красной Армии командир взвода, роты в 25-й стрелковой (Чапаевской) дивизии, начальник пограничного поста, командир Памирского отряда, командир батальона, командир 9-го отдельного Туркестанского Краснознаменного горнострелкового полка.
        С началом Великой Отечественной войны И.В.Панфилов приступил к формированию 316-й стрелковой дивизии. В эту дивизию набирались жители Киргизии и Казахстана. Сформированная дивизия была направлена под Москву и уже в начале октября держала полосу обороны протяженностью в 41 километр на волоколамском направлении.
        10 октября 316-я дивизия вступила в неравный бой с противником и в результате продолжительных оборонительных боев смогла нанести ему значительный урон разгромив 2-ю танковую, 29-ю моторизованную, 11 и 110-ю пехотные дивизии, уничтожив 9000 вражеских солдат и офицеров, более 80 танков, многоорудий, минометов и другого оружия. 18 ноября в ходе минометного обстрела противника командир дивизии погиб.
        316-й стрелковая дивизия (с ноября - Краснознамённая, гвардейская), 23 ноября получила почётное звание Панфиловской. Боевое знамя г вардейской 11анфиловской дивизии реяло в числе других на Параде Победы
        в Москве в 1945 г.
        12 апреля 1942 г. генерал-майор И.В.Панфилов был посмертно награжден орденом Ленина и ему было присвоено звание Героя Советского Союза - за умелое руководство частями дивизии в боях на подступах к городу Москве и проявленные при этом личную храбрость и героизм его имя было увековечено в разных частях Советского союза, памятники и улицы Панфилова появились в Москве, Алма-Ате, Бишкеке, Перми, Липецке, Волоколамске, и др.`,
      photo: 'main/панфилов.png',
    },
    {
      fio: 'ГРИГОРИЙ КУЗЬМИЧ ЧЕРНЫХ',
      birthdate: '(1898-1961)',
      position: 'ВОЕННЫЙ КОМИССАР',
      region: 'города Москвы (1939-1958)',
      description: `Генерал-майор, участник Первой мировой войны и Гражданской войн, военный комиссар Московского военного комиссариата. Проходил военную службу на воинских должностях в Красной Армиии, в уездных военных комиссариатах Брянской губернии, военным комиссаром Витебского и Калининского областных военкоматов.
        В должности военного комиссара г. Москвы в годы Великой Отечественной войны обеспечил регулярное пополнение личным составом армейских подразделений, формирование резервных частей, комплектование военных училищ, провёл, мобилизацию трудящихся в дивизии народного ополчения. Было сформировано и отправлено на фронт 12 дивизий народного ополчения.
        Большая работа была проведена по организации всеобщей военной подготовки населения. Было подготовлено более 200 тысяч человек по воинским специальностям. Из них 11233 снайпера, 6332 связиста, 23000 станковых пулемётчиков, 15283 миномётчиков, 12906 истребителей военкоматами Москвы было мобилизовано более 713 тысяч военнообязанных, сформировано 235 войсковых частей, направлено в войска более 25 тысяч единиц автомобилей
        и другой техники.
        После окончания Великой Отечественной войны провел масштабную работу по приему увольняемых военнослужащих на воинский учет, их трудовым и бытовым устройством.
        Учрежден кубок имени генерал-майора Черных Г.К. которым награждается лучший военный комиссариат г. Москвы`,
      photo: 'main/черных.png',
    },
  ];

  // Эффект для отслеживания прокрутки текста и переключения слайдов
  useEffect(() => {
    if (textScrolled) {
      const timer = setTimeout(() => {
        if (sliderRef.current) {
          const nextSlide = (currentSlide + 1) % featuredCommissioners.length;
          sliderRef.current.slickGoTo(nextSlide);
        }
      }, 2000); // Ждем 2 секунды после завершения прокрутки

      return () => clearTimeout(timer);
    }
  }, [textScrolled, currentSlide, featuredCommissioners.length]);

  // Эффект для автоматического переключения слайдов после прокрутки текста
  useEffect(() => {
    if (isPaused) return; // Не переключаем если на паузе

    // Рассчитываем время прокрутки на основе длины текста
    const getScrollDuration = (text: string) => {
      const wordsPerMinute = 200; // Скорость чтения
      const words = text.split(' ').length;
      const minutes = words / wordsPerMinute;
      return Math.max(minutes * 60 * 1000, 8000); // Минимум 8 секунд
    };

    const currentDescription = featuredCommissioners[currentSlide].description;
    const scrollDuration = getScrollDuration(currentDescription);
    const pauseDuration = 2000; // 2 секунды паузы

    const timer = setTimeout(() => {
      if (sliderRef.current && !isPaused) {
        const nextSlide = (currentSlide + 1) % featuredCommissioners.length;
        sliderRef.current.slickGoTo(nextSlide);
      }
    }, scrollDuration + pauseDuration);

    return () => clearTimeout(timer);
  }, [currentSlide, featuredCommissioners, isPaused]);

  return (
    <div className="mx-auto flex h-screen w-[720px] flex-col overflow-hidden bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900">
      <div className="flex size-full flex-col gap-[20px]">
        <div className="flex h-[35%] items-center justify-center p-5">
          <div className="size-full overflow-hidden">
            <Slider
              ref={sliderRef}
              {...horizontalSliderSettings}
              className="h-full"
            >
              {featuredCommissioners.map((commissioner, index) => (
                <div
                  key={index}
                  className="flex h-full items-center justify-center"
                  onMouseEnter={() => setIsPaused(true)}
                  onMouseLeave={() => setIsPaused(false)}
                >
                  <div className="flex size-full gap-8 text-white">
                    <div className="relative flex w-56 shrink-0 items-start justify-center">
                      <img
                        src={`/images/${commissioner.photo}`}
                        alt={`Фото ${commissioner.fio}`}
                        className="absolute inset-0 size-full rounded-lg object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-2 overflow-y-auto pr-3">
                      <div className="flex h-fit flex-col">
                        <h1 className="m-0 text-4xl font-black uppercase leading-tight tracking-tight text-white drop-shadow-lg">
                          {commissioner.fio.split(' ').slice(-1)[0]}
                        </h1>
                        <h1 className="m-0 text-2xl font-bold uppercase leading-tight tracking-wide text-white drop-shadow-lg">
                          {commissioner.fio.split(' ').slice(0, -1).join(' ')}
                        </h1>
                      </div>
                      <p className="m-0 text-lg font-semibold text-white drop-shadow">
                        {commissioner.birthdate}
                      </p>
                      <h2 className="m-0 text-xl font-bold uppercase tracking-wide text-white drop-shadow-lg">
                        {commissioner.position}
                      </h2>
                      <p className="m-0 text-base whitespace-pre-wrap font-medium text-white opacity-90">
                        {commissioner.region}
                      </p>

                      <div className="flex-1 overflow-hidden">
                        <Marquee
                          direction="up"
                          className="h-full"
                          fade
                          numberOfCopies={1}
                        >
                          <div className="mb-2">
                            <p className="m-0 text-justify text-sm leading-tight text-white">
                              {commissioner.description}
                            </p>
                          </div>
                        </Marquee>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </Slider>
          </div>
        </div>

        <div className="relative h-[65%] overflow-hidden">
          <Marquee
            direction="up"
            className="slow-marquee h-full !gap-1"
            innerClassName="!gap-1"
            fade
            numberOfCopies={1}
          >
            {commissionerPairs.map((pair, pairIndex) => (
              <div
                key={pairIndex}
                className="mb-[0.1rem] flex justify-center gap-1"
              >
                {pair.length === 1 ? (
                  <div className="mx-auto flex h-96 max-w-[340px] flex-1 flex-col rounded-xl border border-blue-300/30 bg-white/10 p-5 shadow-lg backdrop-blur-sm">
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
                        <h4 className="m-0 w-10/12 text-base font-semibold text-white">
                          <div className="absolute right-0 top-0 flex flex-col items-center gap-2">
                            <div className="h-6 w-12 overflow-hidden">
                              <img
                                src={`/images/${pair[0].flag}`}
                                alt={`Флаг ${pair[0].fio}`}
                                className="size-full object-cover"
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
                                className="size-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-white">
                              {pair[0].fio.split(' ')[0]}
                            </span>
                            <span className="text-[10px] text-gray-300">
                              {pair[0].fio.split(' ').slice(1).join(' ')}
                            </span>
                          </div>
                        </h4>
                        <p className="m-0 text-sm font-medium text-gray-300">
                          {pair[0].rank}
                        </p>
                        <p className="m-0 text-sm leading-none text-gray-200">
                          {pair[0].position}
                        </p>
                        <p className="m-0 text-xs text-gray-400">
                          {pair[0].birthdate}
                        </p>
                      </div>
                    </div>
                    <div className="flex min-h-0 flex-1 flex-col">
                      <div className="shrink-0">
                        <h5 className="m-0 mb-1 border-b-2 border-blue-400/50 pb-1 text-sm font-semibold text-white">
                          Последняя должность:
                        </h5>
                        <p className="m-0 text-sm leading-none text-gray-200">
                          {pair[0].last_position.title}
                        </p>
                        <p className="m-0 text-xs italic text-gray-400">
                          {pair[0].last_position.date_1} -{' '}
                          {pair[0].last_position.date_2}
                        </p>
                      </div>

                      <div className="min-h-0 flex-1 overflow-hidden">
                        <div className="flex h-full flex-col gap-2">
                          {pair[0].medals && pair[0].medals.length > 0 && (
                            <div className="flex-1">
                              <h5 className="m-0 mb-1 border-b-2 border-blue-400/50 pb-1 text-sm font-semibold text-white">
                                Награды:
                              </h5>
                              <div className="h-12 overflow-hidden">
                                <Slider
                                  key={`medals-${pairIndex}`}
                                  {...verticalSliderSettings}
                                >
                                  {pair[0].medals.map((medal, medalIndex) => (
                                    <div key={medalIndex}>
                                      <p className="m-0 text-xs leading-none text-gray-200">
                                        {medal}
                                      </p>
                                    </div>
                                  ))}
                                </Slider>
                              </div>
                            </div>
                          )}

                          {pair[0].achievement &&
                            pair[0].achievement.length > 0 && (
                              <div className="flex-1">
                                <h5 className="m-0 mb-1 border-b-2 border-blue-400/50 pb-1 text-sm font-semibold text-white">
                                  Достижения:
                                </h5>
                                <div className="h-12 overflow-hidden">
                                  <Slider
                                    key={`achievements-${pairIndex}`}
                                    {...verticalSliderSettings}
                                  >
                                    {pair[0].achievement.map(
                                      (achievement, achievementIndex) => (
                                        <div key={achievementIndex}>
                                          <p className="m-0 text-xs leading-none text-gray-200">
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
                      className="flex max-w-[340px] flex-1 flex-col rounded-xl border border-blue-300/30 bg-white/10 p-5 shadow-lg backdrop-blur-sm"
                    >
                      <div className="mb-2 flex h-40 shrink-0 items-start gap-2 overflow-hidden">
                        <div className="w-28 min-h-64 overflow-hidden rounded">
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
                          <div className="absolute right-0 top-0 flex flex-col items-center gap-2">
                            <div className="h-6 w-12 overflow-hidden">
                              <img
                                src={`/images/${commissioner.flag}`}
                                alt={`Флаг ${commissioner.fio}`}
                                className="size-full object-cover"
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
                                className="size-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            </div>
                          </div>

                          <h4 className="m-0 w-10/12 text-base font-semibold text-white">
                            <div className="flex flex-col">
                              <span className="font-black text-white">
                                {commissioner.fio.split(' ')[0]}
                              </span>
                              <span className="text-[10px] text-gray-300">
                                {commissioner.fio.split(' ').slice(1).join(' ')}
                              </span>
                            </div>
                          </h4>
                          <p className="m-0 text-sm font-medium text-gray-300">
                            {commissioner.rank}
                          </p>
                          <p className="m-0 text-sm leading-none text-gray-200">
                            {commissioner.position}
                          </p>
                          <p className="m-0 text-xs text-gray-400">
                            {commissioner.birthdate}
                          </p>
                        </div>
                      </div>

                      <div className="flex min-h-0 flex-1 flex-col">
                        <div className="mb-2 shrink-0">
                          <h5 className="m-0 mb-1 border-b-2 border-blue-400/50 pb-1 text-sm font-semibold text-white">
                            Последняя должность:
                          </h5>
                          <p className="m-0 text-sm leading-none text-gray-200">
                            {commissioner.last_position.title}
                          </p>
                          <p className="m-0 text-xs italic text-gray-400">
                            {commissioner.last_position.date_1} -{' '}
                            {commissioner.last_position.date_2}
                          </p>
                        </div>

                        <div className="min-h-0 flex-1 overflow-hidden">
                          <div className="flex h-full flex-col gap-2">
                            {commissioner.medals &&
                              commissioner.medals.length > 0 && (
                                <div className="flex-1">
                                  <h5 className="m-0 mb-1 border-b-2 border-blue-400/50 pb-1 text-sm font-semibold text-white">
                                    Награды:
                                  </h5>
                                  <div className="h-12 overflow-hidden">
                                    <Slider
                                      key={`medals-pair-${pairIndex}-${index}`}
                                      {...verticalSliderSettings}
                                    >
                                      {commissioner.medals.map(
                                        (medal, medalIndex) => (
                                          <div key={medalIndex}>
                                            <p className="m-0 text-xs leading-none text-gray-200">
                                              {medal}
                                            </p>
                                          </div>
                                        ),
                                      )}
                                    </Slider>
                                  </div>
                                </div>
                              )}

                            {commissioner.achievement &&
                              commissioner.achievement.length > 0 && (
                                <div className="flex-1">
                                  <h5 className="m-0 mb-1 border-b-2 border-blue-400/50 pb-1 text-sm font-semibold text-white">
                                    Достижения:
                                  </h5>
                                  <div className="h-12 overflow-hidden">
                                    <Slider
                                      key={`achievements-pair-${pairIndex}-${index}`}
                                      {...verticalSliderSettings}
                                    >
                                      {commissioner.achievement.map(
                                        (achievement, achievementIndex) => (
                                          <div key={achievementIndex}>
                                            <p className="m-0 text-xs leading-none text-gray-200">
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
