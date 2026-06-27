const axios = require('axios');

const query = `
query {
  Page(page: 1, perPage: 20) {
    media(status: NOT_YET_RELEASED, type: ANIME, sort: POPULARITY_DESC) {
      id
      title { romaji english }
      popularity
      relations {
        edges {
          relationType
          node {
            type
            averageScore
            title { romaji }
          }
        }
      }
    }
  }
}
`;

axios.post('https://graphql.anilist.co', { query }).then(res => {
  console.log(JSON.stringify(res.data.data.Page.media.slice(0, 2), null, 2));
}).catch(console.error);
