export type Commissioner = {
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
