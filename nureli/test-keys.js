const {GoogleGenerativeAI} = require('@google/generative-ai');

const keys = [
  ['Env', 'AIzaSyBmPpDMoW2cGgz1S5gryNNQUEsYsJpFEPg'],
  ['K2', 'AIzaSyCalkApmeJWxbaqFIYcJn_WqTX8ofMuBIM'],
  ['K5', 'AIzaSyCGttXCj0AC_FbCwP0Mh_eyMK9tZGOYV9g'],
  ['K7', 'AIzaSyD9VRat9jWgpizgH541dRatTYctWopz_Vo'],
];

(async () => {
  for (const [name, key] of keys) {
    try {
      const g = new GoogleGenerativeAI(key);
      const start = Date.now();
      const r = await g.getGenerativeModel({model: 'gemini-2.5-flash'}).generateContent('Say hi in 2 words');
      console.log(name + ': OK (' + ((Date.now()-start)/1000).toFixed(1) + 's) - ' + r.response.text().trim().slice(0,30));
    } catch(e) {
      console.log(name + ': FAIL - ' + e.message.slice(0, 120));
    }
  }
})();
