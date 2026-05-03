// Bilingual festival options: { key, zh, en }
export const FESTIVAL_OPTIONS = [
  { key: 'anniversary', zh: '紀念日', en: 'Anniversary' },
  { key: 'valentines', zh: '情人節', en: "Valentine's Day" },
  { key: 'wedding_anniversary', zh: '結婚週年', en: 'Wedding Anniversary' },
  { key: 'birthday', zh: '生日', en: 'Birthday' },
  { key: 'christmas', zh: '聖誕節', en: 'Christmas' },
  { key: 'new_year', zh: '新一年', en: 'New Year' },
  { key: 'lunar_new_year', zh: '農曆新年', en: 'Lunar New Year' },
  { key: 'easter', zh: '復活節', en: 'Easter' },
  { key: 'halloween', zh: '萬聖節', en: 'Halloween' },
  { key: 'graduation', zh: '畢業', en: 'Graduation' },
  { key: 'baby_born', zh: 'BB出世', en: 'Baby Born' },
  { key: 'mothers_day', zh: '母親節', en: "Mother's Day" },
  { key: 'fathers_day', zh: '父親節', en: "Father's Day" },
  { key: 'retirement', zh: '退休', en: 'Retirement' },
  { key: 'wedding', zh: '結婚', en: 'Wedding' },
  { key: 'other', zh: '其他', en: 'Other' },
];

// Bilingual decoration options per festival key
export const DECORATION_BY_FESTIVAL: Record<string, Array<{ key: string; zh: string; en: string }>> = {
  anniversary: [
    { key: 'hearts', zh: '愛心', en: 'Hearts' },
    { key: 'photo_frame', zh: '相框', en: 'Photo Frame' },
    { key: 'candlelight', zh: '燭光', en: 'Candlelight' },
    { key: 'petals', zh: '花瓣', en: 'Petals' },
    { key: 'handwriting', zh: '手寫字體', en: 'Handwriting Font' },
  ],
  valentines: [
    { key: 'roses', zh: '玫瑰', en: 'Roses' },
    { key: 'heart_shape', zh: '心形', en: 'Heart Shape' },
    { key: 'chocolate', zh: '巧克力', en: 'Chocolate' },
    { key: 'love_hearts', zh: '愛心', en: 'Love Hearts' },
    { key: 'romantic_lights', zh: '浪漫燈光', en: 'Romantic Lights' },
  ],
  wedding_anniversary: [
    { key: 'champagne', zh: '香檳', en: 'Champagne' },
    { key: 'wedding_ring', zh: '婚戒', en: 'Wedding Ring' },
    { key: 'photo_frame', zh: '相框', en: 'Photo Frame' },
    { key: 'bouquet', zh: '花束', en: 'Bouquet' },
    { key: 'gold_dust', zh: '金粉', en: 'Gold Dust' },
  ],
  birthday: [
    { key: 'birthday_cake', zh: '生日蛋糕', en: 'Birthday Cake' },
    { key: 'candles', zh: '蠟燭', en: 'Candles' },
    { key: 'balloons', zh: '氣球', en: 'Balloons' },
    { key: 'ribbons', zh: '彩帶', en: 'Ribbons' },
    { key: 'gift_box', zh: '禮物盒', en: 'Gift Box' },
  ],
  christmas: [
    { key: 'christmas_tree', zh: '聖誕樹', en: 'Christmas Tree' },
    { key: 'snowflakes', zh: '雪花', en: 'Snowflakes' },
    { key: 'santa_hat', zh: '聖誕帽', en: 'Santa Hat' },
    { key: 'reindeer', zh: '麋鹿', en: 'Reindeer' },
    { key: 'bells', zh: '鈴鐺', en: 'Bells' },
  ],
  new_year: [
    { key: 'fireworks', zh: '煙花', en: 'Fireworks' },
    { key: 'gold_dust', zh: '金粉', en: 'Gold Dust' },
    { key: 'countdown_clock', zh: '倒數時鐘', en: 'Countdown Clock' },
    { key: 'champagne', zh: '香檳', en: 'Champagne' },
    { key: 'lights', zh: '燈飾', en: 'Lights' },
  ],
  lunar_new_year: [
    { key: 'red_envelope', zh: '利是封', en: 'Red Envelope' },
    { key: 'spring_couplet', zh: '揮春', en: 'Spring Couplet' },
    { key: 'lantern', zh: '燈籠', en: 'Lantern' },
    { key: 'gold_ingot', zh: '金元寶', en: 'Gold Ingot' },
    { key: 'lion_dance', zh: '舞獅', en: 'Lion Dance' },
  ],
  easter: [
    { key: 'easter_eggs', zh: '彩蛋', en: 'Easter Eggs' },
    { key: 'bunny', zh: '兔子', en: 'Bunny' },
    { key: 'wreath', zh: '花圈', en: 'Wreath' },
    { key: 'spring_flowers', zh: '春日花朵', en: 'Spring Flowers' },
    { key: 'meadow', zh: '草地', en: 'Meadow' },
  ],
  halloween: [
    { key: 'jack_o_lantern', zh: '南瓜燈', en: "Jack-o'-Lantern" },
    { key: 'spider_web', zh: '蜘蛛網', en: 'Spider Web' },
    { key: 'ghost', zh: '小幽靈', en: 'Ghost' },
    { key: 'bat', zh: '蝙蝠', en: 'Bat' },
    { key: 'candy', zh: '糖果', en: 'Candy' },
  ],
  graduation: [
    { key: 'grad_cap', zh: '畢業帽', en: 'Graduation Cap' },
    { key: 'diploma', zh: '證書卷軸', en: 'Diploma Scroll' },
    { key: 'campus', zh: '校園元素', en: 'Campus Elements' },
    { key: 'balloons', zh: '氣球', en: 'Balloons' },
    { key: 'bouquet', zh: '花束', en: 'Bouquet' },
  ],
  baby_born: [
    { key: 'pacifier', zh: '奶嘴', en: 'Pacifier' },
    { key: 'teddy_bear', zh: '小熊玩偶', en: 'Teddy Bear' },
    { key: 'stroller', zh: '嬰兒車', en: 'Stroller' },
    { key: 'clouds', zh: '雲朵', en: 'Clouds' },
    { key: 'stars', zh: '星星', en: 'Stars' },
  ],
  mothers_day: [
    { key: 'carnation', zh: '康乃馨', en: 'Carnation' },
    { key: 'hearts', zh: '愛心', en: 'Hearts' },
    { key: 'bouquet', zh: '花束', en: 'Bouquet' },
    { key: 'crown', zh: '皇冠', en: 'Crown' },
    { key: 'family_photo', zh: '全家福', en: 'Family Photo' },
  ],
  fathers_day: [
    { key: 'necktie', zh: '領帶', en: 'Necktie' },
    { key: 'trophy', zh: '獎杯', en: 'Trophy' },
    { key: 'mustache', zh: '鬍子', en: 'Mustache' },
    { key: 'stars', zh: '星星', en: 'Stars' },
    { key: 'coffee_cup', zh: '咖啡杯', en: 'Coffee Cup' },
  ],
  retirement: [
    { key: 'sunset', zh: '夕陽', en: 'Sunset' },
    { key: 'suitcase', zh: '旅行箱', en: 'Suitcase' },
    { key: 'coffee_cup', zh: '咖啡杯', en: 'Coffee Cup' },
    { key: 'bouquet', zh: '花束', en: 'Bouquet' },
    { key: 'plaque', zh: '紀念牌', en: 'Plaque' },
  ],
  wedding: [
    { key: 'roses', zh: '玫瑰花', en: 'Roses' },
    { key: 'wedding_ring', zh: '婚戒', en: 'Wedding Ring' },
    { key: 'veil', zh: '白紗', en: 'Veil' },
    { key: 'heart_lights', zh: '心形光點', en: 'Heart Lights' },
    { key: 'champagne_glass', zh: '香檳杯', en: 'Champagne Glass' },
  ],
  other: [
    { key: 'starlight', zh: '星光', en: 'Starlight' },
    { key: 'flowers', zh: '花朵', en: 'Flowers' },
    { key: 'ribbons', zh: '彩帶', en: 'Ribbons' },
    { key: 'hearts', zh: '愛心', en: 'Hearts' },
    { key: 'gold_dust', zh: '金粉', en: 'Gold Dust' },
  ],
};

// Color theme presets: each has 3 colors
export interface ColorTheme {
  key: string;
  zh: string;
  en: string;
  colors: [string, string, string];
}

export const COLOR_THEMES: ColorTheme[] = [
  { key: 'warm_sunset', zh: '暖陽落日', en: 'Warm Sunset', colors: ['#FF6B6B', '#FFA07A', '#FFD700'] },
  { key: 'rose_garden', zh: '玫瑰花園', en: 'Rose Garden', colors: ['#E91E63', '#FF80AB', '#FCE4EC'] },
  { key: 'ocean_breeze', zh: '海洋微風', en: 'Ocean Breeze', colors: ['#0077B6', '#00B4D8', '#90E0EF'] },
  { key: 'forest_dream', zh: '森林幻夢', en: 'Forest Dream', colors: ['#2D6A4F', '#52B788', '#D8F3DC'] },
  { key: 'lavender_night', zh: '薰衣草夜', en: 'Lavender Night', colors: ['#7B2D8E', '#C084FC', '#F3E8FF'] },
  { key: 'custom', zh: '自訂顏色', en: 'Custom Colors', colors: ['#FF6B9D', '#C084FC', '#FFFFFF'] },
];
