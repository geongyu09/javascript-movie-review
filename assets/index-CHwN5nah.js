(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) return;
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) processPreload(link);
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;
      for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
    }
  }).observe(document, {
    childList: true,
    subtree: true
  });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep) return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
function fetcher(arg) {
  const { fn, onSuccess, onError, onLoading } = arg;
  onLoading();
  fn().then(onSuccess).catch((e) => {
    console.error(e);
    onError(e instanceof Error ? e : new Error(String(e)));
  });
}
const API_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI5OWNhNWM5MTZmMDhiZjlhOTNkZjcxZWJiMDU3OTljOCIsIm5iZiI6MTc3NDkxODU3OS42MTQsInN1YiI6IjY5Y2IxYmIzMDcwN2Q2MWQ2NTQyYTJiNSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.d62TYMRQOEvwMv3kz_VL9KZYTZ-GntmUpTP8VIji6mk";
const API_PATH = {
  POPULAR_MOVIE: "https://api.themoviedb.org/3/movie/popular",
  SEARCH_MOVIE: "https://api.themoviedb.org/3/search/movie"
};
async function getPopularMovies(arg) {
  const { pageNum, onSuccess, onError, onLoading } = arg;
  fetcher({
    fn: async () => {
      const url = `${API_PATH.POPULAR_MOVIE}?page=${pageNum}&language=ko-KR`;
      const options = {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${API_KEY}`
        }
      };
      const response = await fetch(url, options);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data;
    },
    onSuccess,
    onError,
    onLoading
  });
}
async function getSearchMovies(arg) {
  const { query, pageNum, onSuccess, onError, onLoading } = arg;
  fetcher({
    fn: async () => {
      const url = `${API_PATH.SEARCH_MOVIE}?query=${query}&page=${pageNum}&language=ko-KR`;
      const options = {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${API_KEY}`
        }
      };
      const response = await fetch(url, options);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data;
    },
    onSuccess,
    onError,
    onLoading
  });
}
const starEmptyImg = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAxCAYAAACcXioiAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAQ4SURBVHgB7VlNctMwFP7UwrRl0/YGzgloNwyURd0TQE5AeoK2J2hyAuAEaU9QOEHMgvCzSW9QcwLChqbDNOI9RVEk106sWGZY5JvR+FlRJD29fxlYYYX/F/I79uQXxKgRAjWANh3Ro0ct0l0ptSPxQj2DYg31oIvZ5qHpLmpAcAno07+ZdWBIq+zoN5ZCgoCoQwLnhhK4oBUS8y7xGoFRhwT49CP9eqSfPb3aEBtoiH16BkJQCdDmW7AMl9VFq0w6GUCqdKvGBENoFXpj0R2LvjSUwCsERDAGtPHGVldiqBHeWf0xxwcEQkgJOMZr+3xxpHQ+Mb//CWfMIRmIDSUtlZlhplLrOJED41orIQgDecabHaP6pPY+E2OOEQChJFBkvC4E3lv0CQIgNw4o8Y6UiCNicQdjanxqQrVtQ0s9xk0bGkU5j+zR+E38tFa/1pF6aD1/GXrqfteJfkySzYkfImfjV8CS4mXjfY7jeUNkn+YXSxvxBR3Amc3II+fnEd4CS+tmQlH2bOGoO2JwC8umFS3aI8MckiuBPol3lnilqs3EyfjxQORjak/yxTsPStq/tYraKikMvY2pak769/SOhyTl3ek8j+aswb68g5qgGb4uM1Z+oxgzzg9+rheyvQTQll9xFcpfLwNeW9nMGG2r+4M9xmWAQ760BrCejjDQacI/hVqT1nYMXtDeMnYmCv7chp0asC2soymelRN5VcjPpC5ryhtGpnOMjnjpSEIhN5CR7reJNZvTCPckiT5OUTNIbU9oVwPYm5fkOnM2z5hb0OSeBNlGXcatjbVtdaX03qTNF0p+YUWWc8Mw1cXjUJWVchS3VPS7+s5RurnoJqNUSalSgI3MAnw6m9ivyoSO/lmVuaRgd1pm7lLJHOfz4gBNuIlaFKQ8HKlDicw7G+sBWmUPxisbVcYtrVixhqeojtiiO0XGWgT/dFqoED+BpNSiOlJrPu+g6c+AdEJ6gupIDLVEwe91L5S9dSOVqnyvpB3EjUkiN7Hr4xj8JBD+9CcFv7D8/MgvzfZjwBXxp0XDPa7XZ3NJvysXXxuILTopGsSbppRgwOkHvfb4unFBQpgYytMOSuuwo/+ZosKM4aB0R+mALMiZJGW7lLLnRddMMdUo+y3BRwKxtZEHuYlSFY6o9ualrtymEOq3nr6GcSGcOWOUhA8Dh5ht7KMhSTLUOFdy8yVWC4F91eBcdPGYLv2n66iVNSf95xAlsZwE9Gmp1FcqPY+tjQxpVk7C1Ccl3VqYFOKpNR/39UyKbktAlpeAjw1I65Xv/c+RFTWnGVuUbhf4cX3ibbgXYYxUzSlVBeZlBz4M9FCsmym147Kfj9Tt9P2DOiOLUgz4qFCnsJ/Tao9vX1ya0vjGnDnTsl7IL5XoU5Sc3GlGyhNR2Vn106lSK6lu66YBLEVNn2RrBZevqoRdYYUVvPAXJrOCc9SFL6sAAAAASUVORK5CYII=";
const noImagePlanetImg = "/javascript-movie-review/assets/no_image_planet-DQ-7fxyf.png";
const screamingPlanetImg = "/javascript-movie-review/assets/screaming_planet-BZvmNwfY.svg";
const planetAndStarImg = "/javascript-movie-review/assets/planet_and_star-CJk4xH6r.png";
const IMAGE_PATH = "https://image.tmdb.org/t/p/original";
const Component = {
  movie(movieData) {
    const { poster_path, title, vote_average } = movieData;
    const src = poster_path ? `${IMAGE_PATH}/${poster_path}` : noImagePlanetImg;
    return `
    <li>
      <div class="item">
      <img
      class="thumbnail"
      src="${src}"
      alt="${title}"
      />
        <div class="item-desc">
          <p class="rate">
            <img src="${starEmptyImg}" class="star" /><span>${vote_average.toFixed(1)}</span>
            </p>
            <strong>${title}</strong>
        </div>
      </div>
    </li>
  `;
  },
  movieSkeleton() {
    return `
    <li class="skeleton">
      <div class="item">
        <div class="thumbnail skeleton-box"></div>
        <div class="item-desc">
          <p class="rate">
            <span class="skeleton-box skeleton-rate"></span>
          </p>
          <span class="skeleton-box skeleton-title"></span>
        </div>
      </div>
    </li>
  `;
  },
  movieBanner({
    title,
    vote_average,
    poster_path
  }) {
    return `
      <div class="top-rated-movie" style="background-image: url('${IMAGE_PATH}/${poster_path}')">
        <div class="overlay" aria-hidden="true"></div>
          <div class="container">
            <div class="rate">
              <img src="${starEmptyImg}" class="star" />
              <span class="rate-value">${vote_average.toFixed(1)}</span>
            </div>
            <div class="title">${title}</div>
            <button class="primary detail">자세히 보기</button>
          </div>
        </div>
      </div>
    `;
  },
  emptyResult() {
    return `
      <div class="notice-box">
        <img src="${screamingPlanetImg}">
        <p class="notice-text">검색 결과가 없습니다.</p>
      </div>
      `;
  },
  error(message) {
    return `
      <div class="notice-box">
        <img src="${planetAndStarImg}">
        <span class="notice-text">${message}</span>
      </div>
    `;
  }
};
const Renderer = {
  renderSectionHeading() {
    const heading = document.querySelector("section > h2");
    if (heading instanceof HTMLElement) {
      heading.innerHTML = `지금 인기 있는 영화`;
    }
  },
  renderSearchSectionHeading(title) {
    const heading = document.querySelector("section > h2");
    if (heading instanceof HTMLElement) {
      heading.innerHTML = `"${title}"검색 결과`;
      heading.style.marginTop = "12rem";
    }
  },
  renderSearchMovies(movies) {
    const movieList = document.querySelector(".thumbnail-list");
    if (movieList) {
      this.renderMovies(movieList, movies);
    }
  },
  clearMovies() {
    const movieList = document.querySelector(".thumbnail-list");
    if (movieList) movieList.innerHTML = "";
  },
  renderBanner(parent, { title, vote_average, poster_path }) {
    parent.innerHTML = Component.movieBanner({
      title,
      vote_average,
      poster_path
    });
  },
  clearBanner() {
    const banner = document.querySelector(".banner-container");
    if (banner) banner.innerHTML = "";
  },
  renderEmptyResult() {
    const section = document.querySelector("section");
    const node = document.createElement("div");
    node.innerHTML = Component.emptyResult();
    section?.appendChild(node);
  },
  clearEmptyResult() {
    const emptyResult = document.querySelector(".empty-result");
    emptyResult?.remove();
  },
  renderError(parent, message) {
    parent.innerHTML = Component.error(message);
  },
  renderSkeleton(parent, length) {
    parent.innerHTML += Array.from({ length }).map(() => Component.movieSkeleton()).join("");
  },
  renderMovies(parent, movies) {
    const movieListComponent = movies.map((movie) => Component.movie(movie)).join("");
    parent.innerHTML += movieListComponent;
  },
  clearSkeleton(parent) {
    parent.innerHTML = [...parent.children].filter((child) => {
      if (child instanceof HTMLElement && child.classList.contains("skeleton")) {
        return false;
      }
      return true;
    }).map((child) => child.outerHTML).join("");
  },
  showLoadMoreButton() {
    const button = document.querySelector(".load-more-button");
    if (button instanceof HTMLElement) button.style.display = "block";
  },
  hideLoadMoreButton() {
    const button = document.querySelector(".load-more-button");
    if (button instanceof HTMLElement) button.style.display = "none";
  }
};
function observeHeaderScroll() {
  const topRatedMovie = document.querySelector(".top-rated-movie");
  const header = document.querySelector(".background-container");
  if (topRatedMovie && header) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        header.classList.toggle("scrolled", !entry.isIntersecting);
      },
      { threshold: 0 }
    );
    observer.observe(topRatedMovie);
  }
}
const State = {
  nextPageNum: 0,
  nextSearchPageNum: 0,
  requestMovieCount: 0,
  getNextPageNum() {
    return this.nextPageNum;
  },
  getNextSearchPageNum() {
    return this.nextSearchPageNum;
  },
  getRequestMovieCount() {
    return this.requestMovieCount;
  },
  setNextPageNum(page) {
    this.nextPageNum = page;
  },
  setNextSearchPageNum(page) {
    this.nextSearchPageNum = page;
  },
  setRequestMovieCount(count) {
    this.requestMovieCount = count;
  }
};
const ONCE_MOVIE_LIMIT = 20;
const INITIAL_PAGE_NUM = 1;
async function loadInitialMovie() {
  const app = document.querySelector("#app");
  if (app) {
    await getPopularMovies({
      pageNum: INITIAL_PAGE_NUM,
      onSuccess: ({ page, results: movies }) => {
        State.setNextPageNum(page + 1);
        State.setRequestMovieCount(movies.length);
        const movieList = document.querySelector(".thumbnail-list");
        const loadMoreButton = document.querySelector(".load-more-button");
        const banner = document.querySelector(".banner-container");
        if (banner) {
          Renderer.renderBanner(banner, movies[0]);
          observeHeaderScroll();
        }
        if (movieList) {
          Renderer.clearSkeleton(movieList);
          Renderer.renderMovies(movieList, movies);
        }
        if (loadMoreButton)
          loadMoreButton.addEventListener("click", loadMoreMovies);
        Renderer.renderSectionHeading();
      },
      onLoading: () => {
        const movieList = document.querySelector(".thumbnail-list");
        if (movieList)
          Renderer.renderSkeleton(
            movieList,
            State.getRequestMovieCount() || ONCE_MOVIE_LIMIT
          );
      },
      onError: (_) => {
        const main = document.querySelector("main");
        if (main)
          Renderer.renderError(main, "영화 정보를 불러오는 데 실패했습니다.");
      }
    });
  }
}
async function loadMoreMovies() {
  await getPopularMovies({
    pageNum: State.getNextPageNum(),
    onSuccess: ({ page, results: movies }) => {
      const movieList = document.querySelector(".thumbnail-list");
      const haveRestPage = movies.length === ONCE_MOVIE_LIMIT;
      State.setNextPageNum(page + 1);
      if (haveRestPage) Renderer.showLoadMoreButton();
      if (movieList) {
        Renderer.clearSkeleton(movieList);
        Renderer.renderMovies(movieList, movies);
      }
    },
    onError: function(_) {
      const section = document.querySelector("section");
      if (section)
        Renderer.renderError(section, "영화 정보를 불러오는 데 실패했습니다.");
      Renderer.clearBanner();
    },
    onLoading: function() {
      const ul = document.querySelector(".thumbnail-list");
      if (ul) Renderer.renderSkeleton(ul, State.getRequestMovieCount());
      Renderer.hideLoadMoreButton();
    }
  });
}
async function loadSearchMovies(query) {
  await getSearchMovies({
    query,
    pageNum: INITIAL_PAGE_NUM,
    onSuccess: ({ page, results: movies }) => {
      const loadMoreButton = document.querySelector(".load-more-button");
      const haveRestPage = movies.length === ONCE_MOVIE_LIMIT;
      if (loadMoreButton) {
        loadMoreButton.removeEventListener("click", loadMoreMovies);
        loadMoreButton.addEventListener(
          "click",
          () => loadMoreSearchMovies(query)
        );
      }
      State.setNextSearchPageNum(page + 1);
      Renderer.clearBanner();
      Renderer.clearMovies();
      Renderer.clearEmptyResult();
      Renderer.renderSearchSectionHeading(query);
      if (haveRestPage) Renderer.showLoadMoreButton();
      if (movies.length === 0) Renderer.renderEmptyResult();
      else Renderer.renderSearchMovies(movies);
    },
    onError: function(_) {
      const main = document.querySelector("main");
      if (main)
        Renderer.renderError(main, "영화 정보를 불러오는 데 실패했습니다.");
    },
    onLoading: function() {
      const movieList = document.querySelector(".thumbnail-list");
      if (movieList)
        Renderer.renderSkeleton(movieList, State.getRequestMovieCount());
      Renderer.hideLoadMoreButton();
    }
  });
}
async function loadMoreSearchMovies(query) {
  await getSearchMovies({
    query,
    pageNum: State.getNextSearchPageNum(),
    onSuccess: ({ page, results: movies }) => {
      const movieList = document.querySelector(".thumbnail-list");
      State.setNextSearchPageNum(page + 1);
      if (movieList) {
        Renderer.clearSkeleton(movieList);
        Renderer.renderSearchMovies(movies);
      }
    },
    onError: function(_) {
      const section = document.querySelector("section");
      if (section)
        Renderer.renderError(section, "영화 정보를 불러오는 데 실패했습니다.");
    },
    onLoading: function() {
      const movieList = document.querySelector(".thumbnail-list");
      if (movieList)
        Renderer.renderSkeleton(movieList, State.getRequestMovieCount());
    }
  });
}
const searchForm = document.querySelector(".search-form");
searchForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = searchForm.querySelector("input");
  if (input) {
    const searchValue = input.value;
    loadSearchMovies(searchValue);
  }
});
addEventListener("load", loadInitialMovie);
