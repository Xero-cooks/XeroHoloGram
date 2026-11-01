/**
 * Canonical 15 Preston Blair / Oculus Viseme Definitions
 */

export enum VisemeName {
  sil = 'viseme_sil', // Silence / Neutral mouth closed
  PP = 'viseme_PP',   // Bilabials: p, b, m
  FF = 'viseme_FF',   // Labiodentals: f, v
  TH = 'viseme_TH',   // Dentals: th
  DD = 'viseme_DD',   // Alveolar: t, d, s, z
  kk = 'viseme_kk',   // Velar: k, g
  CH = 'viseme_CH',   // Palato-alveolar: ch, j, sh
  SS = 'viseme_SS',   // Sibilants: s, z
  nn = 'viseme_nn',   // Nasals: n, ng
  RR = 'viseme_RR',   // Liquids: r
  aa = 'viseme_aa',   // Open vowel: a, ah
  E = 'viseme_E',     // Front vowel: eh, ae
  ih = 'viseme_ih',   // Close front vowel: ih, ee
  oh = 'viseme_oh',   // Back vowel: oh, aw
  ou = 'viseme_ou',   // Rounded back vowel: oo, uw
}

export type VisemeWeights = Record<VisemeName, number>;

export const ZERO_VISEME_WEIGHTS: VisemeWeights = {
  [VisemeName.sil]: 1.0,
  [VisemeName.PP]: 0.0,
  [VisemeName.FF]: 0.0,
  [VisemeName.TH]: 0.0,
  [VisemeName.DD]: 0.0,
  [VisemeName.kk]: 0.0,
  [VisemeName.CH]: 0.0,
  [VisemeName.SS]: 0.0,
  [VisemeName.nn]: 0.0,
  [VisemeName.RR]: 0.0,
  [VisemeName.aa]: 0.0,
  [VisemeName.E]: 0.0,
  [VisemeName.ih]: 0.0,
  [VisemeName.oh]: 0.0,
  [VisemeName.ou]: 0.0,
};
