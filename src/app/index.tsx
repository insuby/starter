import './styles/main.scss';
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
  achievements: string[];
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

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    adaptiveHeight: false,
    autoplay: true,
    autoplaySpeed: 4000,
    pauseOnHover: true,
  };

  const splitTextIntoLines = (text: string, maxLines = 4) => {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim());
    const lines = [];
    const currentLine = '';

    for (const sentence of sentences) {
      if (lines.length >= maxLines) break;

      const trimmedSentence = sentence.trim();
      if (trimmedSentence) {
        lines.push(trimmedSentence);
      }
    }

    return lines;
  };

  const malakhovskyDescription = [
    'Генерал-майор, Первый военный комиссар Латвийской СССР в составе 2-го Прибалтийского фронта. Первый военный комиссар Калининградской области (1946- 1948). В короткие сроки создал военные комиссариаты в области и организовал их работу. За время службы был пять раз ранен и два раза контужен (одна контузия - в результате падения с подбитого аэроплана).',
    'Участник Первой мировой войны, Георгиевский кавалер, ефрейтор в императорской армии, командир стрелкового полка, стрелковой и кавалерийской бригад, кавалерийской дивизии Красной Армии в Гражданскую войну, участник Великой Отечественной войны. Военный комиссар Керченского и Ново-Ушицкого уездов, райвоенкоматов Феодосии, Николаева, Житомира, Чернигова, офицер организационно-мобильных отделов Киевского особого и Прибалтийского военных округов, начальник отдела укомплектования 7 отдельной армии Ленинградского округа (фронта), военный комиссар Латвийской ССР и Калининградской области.',
    'С началом Великой Отечественной войны, в короткие сроки сформировал и укомплектовал воинские части на направлении прорыва белофинов в районе Лайомола. Был назначен военным комендантом Петрозаводска. Организовал оборону города и лично руководил боем воинских частей гарнизона с противником, под обстрелом противника провел эвакуацию предприятий и населения.',
    'Его имя носили пять совхозов и колхозов Воронежской области. Улицы и площади названы в честь Малаховского В.А. в городах Воронеже, Богучаре, Калаче, Острогожске, и др.',
  ];

  return (
    <div className="app">
      <div className="app-container">
        <div className="top-section">
          <div className="historical-person">
            <div className="person-portrait">
              <div className="portrait-placeholder"></div>
            </div>
            <div className="person-info">
              <h2 className="person-title">ВОЕННЫЙ КОМИССАР</h2>
              <p className="person-subtitle">Латвийской СССР (1943-1946)</p>
              <p className="person-subtitle">
                Калининградской области (1946-1948)
              </p>

              <h1 className="person-name">
                ВАЛЕНТИН АЛЕКСАНДРОВИЧ МАЛАХОВСКИЙ
              </h1>
              <p className="person-years">(1894-1971)</p>

              <div className="person-description">
                <Marquee direction="up" className="description-marquee" fade>
                  {malakhovskyDescription.map((paragraph, index) => (
                    <div key={index} className="description-paragraph">
                      <p>{paragraph}</p>
                    </div>
                  ))}
                </Marquee>
              </div>
            </div>
          </div>
        </div>

        <div className="bottom-section">
          <Marquee direction="up" className="commissioners-marquee" fade>
            {commissionerPairs.map((pair, pairIndex) => (
              <div key={pairIndex} className="commissioner-row">
                {pair.length === 1 ? (
                  <div className="commissioner-card single-card">
                    <div className="commissioner-header">
                      <div className="commissioner-photo">
                        <div className="photo-placeholder">
                          {pair[0].fio
                            .split(' ')
                            .map((name) => name[0])
                            .join('')}
                        </div>
                      </div>
                      <div className="commissioner-basic-info">
                        <h4 className="commissioner-name">{pair[0].fio}</h4>
                        <p className="commissioner-rank">{pair[0].rank}</p>
                        <p className="commissioner-position">
                          {pair[0].position}
                        </p>
                        <p className="commissioner-birthdate">
                          {pair[0].birthdate}
                        </p>
                      </div>
                    </div>

                    <div className="commissioner-details">
                      <div className="last-position">
                        <h5>Последняя должность:</h5>
                        <p>{pair[0].last_position.title}</p>
                        <p className="dates">
                          {pair[0].last_position.date_1} -{' '}
                          {pair[0].last_position.date_2}
                        </p>
                      </div>

                      <div className="details-slider">
                        <Slider {...sliderSettings}>
                          {pair[0].medals?.length > 0 && (
                            <div className="slider-slide">
                              <h5>Награды:</h5>
                              <div className="medals-list">
                                {pair[0].medals.map((medal, medalIndex) => {
                                  const medalLines = splitTextIntoLines(
                                    medal,
                                    4,
                                  );
                                  return (
                                    <div
                                      key={medalIndex}
                                      className="medal-item"
                                    >
                                      {medalLines.map((line, lineIndex) => (
                                        <p
                                          key={lineIndex}
                                          className="medal-line"
                                        >
                                          {line}
                                        </p>
                                      ))}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {pair[0].achievements?.length > 0 && (
                            <div className="slider-slide">
                              <h5>Достижения:</h5>
                              <div className="achievements-list">
                                {pair[0].achievements.map(
                                  (achievement, achievementIndex) => {
                                    const achievementLines = splitTextIntoLines(
                                      achievement,
                                      4,
                                    );
                                    return (
                                      <div
                                        key={achievementIndex}
                                        className="achievement-item"
                                      >
                                        {achievementLines.map(
                                          (line, lineIndex) => (
                                            <p
                                              key={lineIndex}
                                              className="achievement-line"
                                            >
                                              {line}
                                            </p>
                                          ),
                                        )}
                                      </div>
                                    );
                                  },
                                )}
                              </div>
                            </div>
                          )}
                        </Slider>
                      </div>
                    </div>
                  </div>
                ) : (
                  pair.map((commissioner, index) => (
                    <div key={index} className="commissioner-card">
                      <div className="commissioner-header">
                        <div className="commissioner-photo">
                          <div className="photo-placeholder">
                            {commissioner.fio
                              .split(' ')
                              .map((name) => name[0])
                              .join('')}
                          </div>
                        </div>
                        <div className="commissioner-basic-info">
                          <h4 className="commissioner-name">
                            {commissioner.fio}
                          </h4>
                          <p className="commissioner-rank">
                            {commissioner.rank}
                          </p>
                          <p className="commissioner-position">
                            {commissioner.position}
                          </p>
                          <p className="commissioner-birthdate">
                            {commissioner.birthdate}
                          </p>
                        </div>
                      </div>

                      <div className="commissioner-details">
                        <div className="last-position">
                          <h5>Последняя должность:</h5>
                          <p>{commissioner.last_position.title}</p>
                          <p className="dates">
                            {commissioner.last_position.date_1} -{' '}
                            {commissioner.last_position.date_2}
                          </p>
                        </div>

                        <div className="details-slider">
                          <Slider {...sliderSettings}>
                            {commissioner.medals?.length > 0 && (
                              <div className="slider-slide">
                                <h5>Награды:</h5>
                                <div className="medals-list">
                                  {commissioner.medals.map(
                                    (medal, medalIndex) => {
                                      const medalLines = splitTextIntoLines(
                                        medal,
                                        4,
                                      );
                                      return (
                                        <div
                                          key={medalIndex}
                                          className="medal-item"
                                        >
                                          {medalLines.map((line, lineIndex) => (
                                            <p
                                              key={lineIndex}
                                              className="medal-line"
                                            >
                                              {line}
                                            </p>
                                          ))}
                                        </div>
                                      );
                                    },
                                  )}
                                </div>
                              </div>
                            )}

                            {commissioner.achievements?.length > 0 && (
                              <div className="slider-slide">
                                <h5>Достижения:</h5>
                                <div className="achievements-list">
                                  {commissioner.achievements.map(
                                    (achievement, achievementIndex) => {
                                      const achievementLines =
                                        splitTextIntoLines(achievement, 4);
                                      return (
                                        <div
                                          key={achievementIndex}
                                          className="achievement-item"
                                        >
                                          {achievementLines.map(
                                            (line, lineIndex) => (
                                              <p
                                                key={lineIndex}
                                                className="achievement-line"
                                              >
                                                {line}
                                              </p>
                                            ),
                                          )}
                                        </div>
                                      );
                                    },
                                  )}
                                </div>
                              </div>
                            )}
                          </Slider>
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
