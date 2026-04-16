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
const render = (callback) => {
  addEventListener("load", () => {
    const app = document.querySelector("#app");
    if (!app) return;
    callback();
  });
};
async function fetcher(arg) {
  const { fn, onSuccess, onError, onLoading } = arg;
  onLoading && onLoading();
  try {
    const response = await fn();
    onSuccess && onSuccess(response);
    return response;
  } catch (error) {
    console.error(error);
    onError && onError(error instanceof Error ? error : new Error(String(error)));
  }
}
const noImagePlanetImg = "/javascript-movie-review/assets/no_image_planet-DQ-7fxyf.png";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original";
class MovieDTO {
  static from(data) {
    return {
      id: data.id,
      title: data.title,
      rating: data.vote_average,
      posterPath: data.poster_path ? `${IMAGE_BASE_URL}/${data.poster_path}` : noImagePlanetImg,
      voteAverage: data.vote_average
    };
  }
}
class MoviesResponseDTO {
  static from(data) {
    return {
      page: data.page,
      movies: data.results.map(MovieDTO.from),
      totalPages: data.total_pages
    };
  }
}
class MovieDetailDTO {
  static from(data) {
    return {
      id: data.id,
      title: data.title,
      posterPath: data.poster_path ? `${IMAGE_BASE_URL}/${data.poster_path}` : noImagePlanetImg,
      voteAverage: data.vote_average,
      genres: data.genres.map((g) => g.name),
      releaseYear: data.release_date.slice(0, 4),
      overview: data.overview
    };
  }
}
const API_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI5OWNhNWM5MTZmMDhiZjlhOTNkZjcxZWJiMDU3OTljOCIsIm5iZiI6MTc3NDkxODU3OS42MTQsInN1YiI6IjY5Y2IxYmIzMDcwN2Q2MWQ2NTQyYTJiNSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.d62TYMRQOEvwMv3kz_VL9KZYTZ-GntmUpTP8VIji6mk";
const API_PATH = {
  POPULAR_MOVIE: "https://api.themoviedb.org/3/movie/popular",
  SEARCH_MOVIE: "https://api.themoviedb.org/3/search/movie",
  MOVIE_DETAIL: "https://api.themoviedb.org/3/movie"
};
async function getPopularMovies(arg) {
  const { pageNum, onSuccess, onError, onLoading } = arg;
  return fetcher({
    fn: async () => {
      const url = new URL(API_PATH.POPULAR_MOVIE);
      url.searchParams.set("page", String(pageNum));
      url.searchParams.set("language", "ko-KR");
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
      return MoviesResponseDTO.from(data);
    },
    onSuccess,
    onError,
    onLoading
  });
}
async function getSearchMovies(arg) {
  const { query, pageNum, onSuccess, onError, onLoading } = arg;
  return fetcher({
    fn: async () => {
      const url = new URL(API_PATH.SEARCH_MOVIE);
      url.searchParams.set("query", query);
      url.searchParams.set("page", String(pageNum));
      url.searchParams.set("language", "ko-KR");
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
      return MoviesResponseDTO.from(data);
    },
    onSuccess,
    onError,
    onLoading
  });
}
async function getMovieDetails(arg) {
  const { movieId, onSuccess, onError, onLoading } = arg;
  return fetcher({
    fn: async () => {
      const url = new URL(`${API_PATH.MOVIE_DETAIL}/${movieId}`);
      url.searchParams.set("language", "ko-KR");
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
      return MovieDetailDTO.from(data);
    },
    onSuccess,
    onError,
    onLoading
  });
}
const deepCopy = (obj) => {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  if (Array.isArray(obj)) {
    const copy2 = [];
    for (const item of obj) {
      copy2.push(deepCopy(item));
    }
    return copy2;
  }
  const copy = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      copy[key] = deepCopy(obj[key]);
    }
  }
  return copy;
};
const createStore = (initialState) => {
  if (typeof initialState === "function" || typeof initialState === "symbol")
    throw new Error("초기값은 함수가 아닌 객체 혹은 원시값이어야 합니다.");
  let state = deepCopy(initialState);
  const getter = () => deepCopy(state);
  const modify = (update) => {
    if (typeof update === "function") {
      state = deepCopy(update(state));
      return;
    }
    state = deepCopy(update);
  };
  return [getter, modify];
};
const nextPageNum = createStore(0);
const nextSearchPageNum = createStore(0);
const DEFAULT_REQUEST_MOVIE_COUNT = 20;
const requestMovieCount = createStore(DEFAULT_REQUEST_MOVIE_COUNT);
const getNextPageNum = nextPageNum[0];
const setNextPageNum = nextPageNum[1];
const getNextSearchPageNum = nextSearchPageNum[0];
const setNextSearchPageNum = nextSearchPageNum[1];
const getRequestMovieCount = requestMovieCount[0];
const setRequestMovieCount = requestMovieCount[1];
const MovieState = {
  getNextPageNum,
  setNextPageNum,
  getNextSearchPageNum,
  setNextSearchPageNum,
  getRequestMovieCount,
  setRequestMovieCount
};
const getItemFromLocalStorage = (key) => {
  const item = localStorage.getItem(key);
  if (!item) return null;
  try {
    return JSON.parse(item);
  } catch {
    return null;
  }
};
const setItemInLocalStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};
const getMyRating = (movieId) => {
  const RATING_STORAGE_KEY = `rating_${movieId}`;
  const savedRate = getItemFromLocalStorage(RATING_STORAGE_KEY);
  if (!savedRate) return 0;
  const rate = parseInt(savedRate);
  return Number.isNaN(rate) ? 0 : rate;
};
const setMyRating = (movieId, rating) => {
  const RATING_STORAGE_KEY = `rating_${movieId}`;
  setItemInLocalStorage(RATING_STORAGE_KEY, `${rating}`);
};
function getElementBySelector(selector) {
  const element = document.querySelector(selector);
  if (element instanceof HTMLElement) return element;
  return null;
}
function getElementsBySelector(selector) {
  return document.querySelectorAll(selector);
}
const getMovieListElement = () => getElementBySelector(".thumbnail-list");
const getBannerElement = () => getElementBySelector(".banner-container");
const getSearchFormElement = () => getElementBySelector(".search-form");
const getSectionElement = () => getElementBySelector("section");
const getSectionHeadingElement = () => getElementBySelector("section > h2");
const getEmptyResultElement = () => getElementBySelector(".empty-result");
const getTopRatedMovieElement = () => getElementBySelector(".top-rated-movie");
const getBackgroundContainerElement = () => getElementBySelector(".background-container");
const getLoadMoreInViewElement = () => getElementBySelector(".load-more-inView");
const getSearchInputElement = () => getElementBySelector(".search-form input");
const getBodyElement = () => getElementBySelector("body");
const getModalBackgroundElement = () => getElementBySelector(".modal-background");
const getModalSkeletonElement = () => getElementBySelector(".modal-background.skeleton");
const getMyRatingElements = () => getElementsBySelector(".my-rating__content img");
function addEventListenerToElement({
  element,
  event,
  handler
}) {
  if (element) element.addEventListener(event, handler);
}
const setupSearchInteraction = (onSearch) => {
  const searchForm = getSearchFormElement();
  addEventListenerToElement({
    element: searchForm,
    event: "submit",
    handler: (event) => {
      event.preventDefault();
      const input = getSearchInputElement();
      if (input) {
        onSearch(input.value);
      }
    }
  });
};
const setupMovieInteraction = (onMovieClick) => {
  const movieList = getMovieListElement();
  if (!movieList) return;
  addEventListenerToElement({
    element: movieList,
    event: "click",
    handler: (event) => {
      const target = event.target;
      const movieItem = target.closest(".movie-item");
      if (movieItem?.dataset.movieId) {
        onMovieClick(movieItem.dataset.movieId);
      }
    }
  });
};
const setupModalCloseInteraction = (onClose) => {
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") onClose();
  });
  document.addEventListener("click", (event) => {
    const target = event.target;
    const isCloseButton = !!target.closest(".close-modal");
    const isBackground = target.classList.contains("modal-background");
    if (isCloseButton || isBackground) onClose();
  });
};
const setupMyRatingInteraction = (onRatingSelect) => {
  const myRatings = getMyRatingElements();
  if (!myRatings) return;
  myRatings.forEach((myRating) => {
    addEventListenerToElement({
      element: myRating,
      event: "click",
      handler: (event) => {
        const ratingItem = event.currentTarget;
        if (!ratingItem) return;
        const ratingValue = ratingItem.dataset.ratingValue;
        onRatingSelect(parseInt(ratingValue || "0"));
      }
    });
  });
};
const starEmptyImg = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAxCAYAAACcXioiAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAQ4SURBVHgB7VlNctMwFP7UwrRl0/YGzgloNwyURd0TQE5AeoK2J2hyAuAEaU9QOEHMgvCzSW9QcwLChqbDNOI9RVEk106sWGZY5JvR+FlRJD29fxlYYYX/F/I79uQXxKgRAjWANh3Ro0ct0l0ptSPxQj2DYg31oIvZ5qHpLmpAcAno07+ZdWBIq+zoN5ZCgoCoQwLnhhK4oBUS8y7xGoFRhwT49CP9eqSfPb3aEBtoiH16BkJQCdDmW7AMl9VFq0w6GUCqdKvGBENoFXpj0R2LvjSUwCsERDAGtPHGVldiqBHeWf0xxwcEQkgJOMZr+3xxpHQ+Mb//CWfMIRmIDSUtlZlhplLrOJED41orIQgDecabHaP6pPY+E2OOEQChJFBkvC4E3lv0CQIgNw4o8Y6UiCNicQdjanxqQrVtQ0s9xk0bGkU5j+zR+E38tFa/1pF6aD1/GXrqfteJfkySzYkfImfjV8CS4mXjfY7jeUNkn+YXSxvxBR3Amc3II+fnEd4CS+tmQlH2bOGoO2JwC8umFS3aI8MckiuBPol3lnilqs3EyfjxQORjak/yxTsPStq/tYraKikMvY2pak769/SOhyTl3ek8j+aswb68g5qgGb4uM1Z+oxgzzg9+rheyvQTQll9xFcpfLwNeW9nMGG2r+4M9xmWAQ760BrCejjDQacI/hVqT1nYMXtDeMnYmCv7chp0asC2soymelRN5VcjPpC5ryhtGpnOMjnjpSEIhN5CR7reJNZvTCPckiT5OUTNIbU9oVwPYm5fkOnM2z5hb0OSeBNlGXcatjbVtdaX03qTNF0p+YUWWc8Mw1cXjUJWVchS3VPS7+s5RurnoJqNUSalSgI3MAnw6m9ivyoSO/lmVuaRgd1pm7lLJHOfz4gBNuIlaFKQ8HKlDicw7G+sBWmUPxisbVcYtrVixhqeojtiiO0XGWgT/dFqoED+BpNSiOlJrPu+g6c+AdEJ6gupIDLVEwe91L5S9dSOVqnyvpB3EjUkiN7Hr4xj8JBD+9CcFv7D8/MgvzfZjwBXxp0XDPa7XZ3NJvysXXxuILTopGsSbppRgwOkHvfb4unFBQpgYytMOSuuwo/+ZosKM4aB0R+mALMiZJGW7lLLnRddMMdUo+y3BRwKxtZEHuYlSFY6o9ualrtymEOq3nr6GcSGcOWOUhA8Dh5ht7KMhSTLUOFdy8yVWC4F91eBcdPGYLv2n66iVNSf95xAlsZwE9Gmp1FcqPY+tjQxpVk7C1Ccl3VqYFOKpNR/39UyKbktAlpeAjw1I65Xv/c+RFTWnGVuUbhf4cX3ibbgXYYxUzSlVBeZlBz4M9FCsmym147Kfj9Tt9P2DOiOLUgz4qFCnsJ/Tao9vX1ya0vjGnDnTsl7IL5XoU5Sc3GlGyhNR2Vn106lSK6lu66YBLEVNn2RrBZevqoRdYYUVvPAXJrOCc9SFL6sAAAAASUVORK5CYII=";
const MovieCardComponent = {
  movie(movieData) {
    const { posterPath, title, voteAverage } = movieData;
    return `
    <li class="movie-item" data-movie-id="${movieData.id}">
      <div class="item">
      <img
      class="thumbnail"
      src="${posterPath}"
      alt="${title}"
      />
        <div class="item-desc">
          <p class="rate">
            <img src="${starEmptyImg}" class="star" /><span>${voteAverage.toFixed(1)}</span>
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
  }
};
const MovieBannerComponent = {
  movieBanner({
    title,
    posterPath,
    voteAverage
  }) {
    return `
      <div class="top-rated-movie" style="background-image: url('${posterPath}')">
        <div class="overlay" aria-hidden="true"></div>
          <div class="container">
            <div class="rate">
              <img src="${starEmptyImg}" class="star" />
              <span class="rate-value">${voteAverage.toFixed(1)}</span>
            </div>
            <div class="title">${title}</div>
            <button class="primary detail">자세히 보기</button>
          </div>
      </div>
    `;
  }
};
const planetAndStarImg = "/javascript-movie-review/assets/planet_and_star-CJk4xH6r.png";
const screamingPlanetImg = "/javascript-movie-review/assets/screaming_planet-BZvmNwfY.svg";
const NoticeComponent = {
  emptyResult() {
    return `
      <div class="notice-box empty-result">
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
  },
  inView() {
    return `
    <div class="load-more-inView"></div>
    `;
  }
};
const ModalComponent = {
  movieModalSkeleton() {
    return `
    <div class="modal-background active skeleton">
      <div class="modal">
        <button class="close-modal" id="closeModal">
          <img src="src/images/modal_button_close.svg" />
        </button>
        <div class="modal-container">
          <div class="modal-image">
            <div class="skeleton-box" style="width:100%;height:100%;"></div>
          </div>
          <div class="modal-description">
            <div class="skeleton-box skeleton-title" style="width:60%;height:2rem;margin-bottom:1rem;"></div>
            <section>
              <div class="skeleton-box" style="width:50%;height:1rem;margin-bottom:0.5rem;"></div>
              <div class="skeleton-box" style="width:30%;height:1rem;"></div>
            </section>
            <hr />
            <section>
              <div class="skeleton-box" style="width:100%;height:4rem;"></div>
            </section>
          </div>
        </div>
      </div>
    </div>
    `;
  },
  movieModalError() {
    return `
    <div class="modal-background active">
      <div class="modal">
        <button class="close-modal" id="closeModal">
          <img src="src/images/modal_button_close.svg" />
        </button>
        <div class="modal-container" style="justify-content:center;align-items:center;">
          <div class="notice-box">
            <img src="${planetAndStarImg}">
            <span class="notice-text">영화 상세 정보를 불러오는 데 실패했습니다.</span>
          </div>
        </div>
      </div>
    </div>
    `;
  },
  movieModal(movie, rating = 0) {
    const { title, posterPath, voteAverage, genres, releaseYear, overview } = movie;
    return `
    <div class="modal-background active">
    <div class="modal">
        <button class="close-modal" id="closeModal">
          <img src="src/images/modal_button_close.svg" />
        </button>
        <div class="modal-container">
          <div class="modal-image">
            <img
              src="${posterPath}"
              alt="${title}"
            />
          </div>
          <div class="modal-description">
            <h2>${title}</h2>
            <section>
              <p class="category">
                ${releaseYear} · ${genres.join(", ")}
              </p>
              <p class="rate">
                <img src="src/images/star_filled.png" class="star" />
                <span>${voteAverage.toFixed(1)}</span>
              </p>
            </section>
            <hr />
            <section class="my-rating">
        <h3 class="my-rating__heading">내 별점</h3>
        <div class="my-rating__content">
          <div>
          ${Array.from({ length: 5 }).map((_, index) => {
      const ratingValue = (index + 1) * 2;
      const starType = ratingValue <= rating ? "star_filled.png" : "star_empty.png";
      return `<img src="src/images/${starType}" class="star" data-rating-value="${ratingValue}" />`;
    }).join("")}
          </div>
          <span>명작이에요</span>
          <span class="my-rating__point">(${rating}/10)</span>
        </div>
      </section>
            <hr />
            <section>
              <h3>줄거리</h3>
              <p class="detail">
                ${overview}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
    `;
  }
};
const appendHTML = (parent, html) => {
  parent.insertAdjacentHTML("beforeend", html);
};
const clearHTML = (parent) => {
  parent.innerHTML = "";
};
const removeElement = (element) => {
  element.remove();
};
const filterHTML = (parent, className) => {
  parent.innerHTML = [...parent.children].filter((child) => {
    if (child instanceof HTMLElement) {
      return !child.classList.contains(className);
    }
    return true;
  }).map((child) => child.outerHTML).join("");
};
const Renderer = {
  renderSectionHeading(element) {
    element.textContent = `지금 인기 있는 영화`;
    element.classList.remove("search-mode");
  },
  renderSearchSectionHeading(element, title) {
    element.textContent = `"${title}"검색 결과`;
    element.classList.add("search-mode");
  },
  renderBanner(parent, { title, voteAverage, posterPath }) {
    parent.innerHTML = MovieBannerComponent.movieBanner({
      title,
      voteAverage,
      posterPath
    });
  },
  renderEmptyResult() {
    const section = getSectionElement();
    const node = document.createElement("div");
    node.innerHTML = NoticeComponent.emptyResult();
    section?.appendChild(node);
  },
  renderError(parent, message) {
    parent.innerHTML = NoticeComponent.error(message);
  },
  renderSkeleton(parent, length) {
    appendHTML(
      parent,
      Array.from({ length }).map(() => MovieCardComponent.movieSkeleton()).join("")
    );
  },
  renderMovies(parent, movies) {
    const movieListComponent = movies.map((movie) => MovieCardComponent.movie(movie)).join("");
    appendHTML(parent, movieListComponent);
  },
  clearSkeleton(parent) {
    const targetClassName = "skeleton";
    filterHTML(parent, targetClassName);
  },
  renderInView(parent) {
    appendHTML(parent, NoticeComponent.inView());
  },
  renderMovieModalSkeleton(parent) {
    appendHTML(parent, ModalComponent.movieModalSkeleton());
  },
  renderMovieModal(parent, movie, rating) {
    appendHTML(parent, ModalComponent.movieModal(movie, rating || 0));
  },
  renderMovieModalError(parent) {
    appendHTML(parent, ModalComponent.movieModalError());
  },
  clearElement(parent) {
    clearHTML(parent);
  },
  removeElement(element) {
    removeElement(element);
  }
};
const paintError = () => {
  const section = getSectionElement();
  if (section)
    Renderer.renderError(section, "영화 정보를 불러오는 데 실패했습니다.");
};
const paintInitialLoading = (skeletonCount) => {
  const movieList = getMovieListElement();
  if (movieList) Renderer.renderSkeleton(movieList, skeletonCount);
};
const paintClearBanner = () => {
  const banner = getBannerElement();
  if (banner) Renderer.clearElement(banner);
};
const paintMovieBanner = (movie) => {
  const banner = getBannerElement();
  if (banner) Renderer.renderBanner(banner, movie);
};
const paintMovieList = (movies) => {
  const movieList = getMovieListElement();
  if (movieList) {
    Renderer.clearSkeleton(movieList);
    Renderer.renderMovies(movieList, movies);
  }
};
const paintHomeSectionHeading = () => {
  const heading = getSectionHeadingElement();
  if (heading) Renderer.renderSectionHeading(heading);
};
const paintSearchSectionHeading = (query) => {
  const heading = getSectionHeadingElement();
  if (heading) Renderer.renderSearchSectionHeading(heading, query);
};
const paintEmptyResult = () => {
  Renderer.renderEmptyResult();
};
const paintResetList = () => {
  const banner = getBannerElement();
  const movieList = getMovieListElement();
  const emptyResult = getEmptyResultElement();
  if (banner) Renderer.clearElement(banner);
  if (movieList) Renderer.clearElement(movieList);
  if (emptyResult) Renderer.removeElement(emptyResult);
};
const paintPrepareSearch = (query, skeletonCount) => {
  paintInitialLoading(skeletonCount);
  paintSearchSectionHeading(query);
};
const paintInView = () => {
  const section = getSectionElement();
  if (section) Renderer.renderInView(section);
};
const paintMovieModalSkeleton = () => {
  const body = getBodyElement();
  if (body) Renderer.renderMovieModalSkeleton(body);
};
const paintRemoveModalSkeleton = () => {
  const skeleton = getModalSkeletonElement();
  if (skeleton) Renderer.removeElement(skeleton);
};
const paintMovieModal = (movie, rating) => {
  const body = getBodyElement();
  if (body) Renderer.renderMovieModal(body, movie, rating);
};
const paintMovieModalError = () => {
  const body = getBodyElement();
  if (body) Renderer.renderMovieModalError(body);
};
const paintRemoveModal = () => {
  const modal = getModalBackgroundElement();
  if (modal) Renderer.removeElement(modal);
};
const reserveIntersectionHandler = (elem, callback) => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        callback(entry);
      });
    },
    { threshold: 0 }
  );
  observer.observe(elem);
  return observer.disconnect.bind(observer);
};
const observeHeaderScroll = () => {
  const topRatedMovie = getTopRatedMovieElement();
  const backgroundContainer = getBackgroundContainerElement();
  if (topRatedMovie && backgroundContainer) {
    reserveIntersectionHandler(topRatedMovie, ({ isIntersecting }) => {
      backgroundContainer.classList.toggle("scrolled", !isIntersecting);
    });
  }
};
const observeLoadMoreScroll = (callback) => {
  const loadMoreInView = getLoadMoreInViewElement();
  if (!loadMoreInView) return;
  let isLoading = false;
  let initialized = false;
  return reserveIntersectionHandler(
    loadMoreInView,
    async ({ isIntersecting }) => {
      if (!initialized) {
        initialized = true;
        return;
      }
      if (loadMoreInView && isIntersecting && !isLoading) {
        isLoading = true;
        await callback();
        isLoading = false;
      }
    }
  );
};
const setupHeaderScrollObserver = () => observeHeaderScroll();
let currentScrollDisconnect;
const replaceLoadMoreScrollObserver = (callback) => {
  currentScrollDisconnect?.();
  currentScrollDisconnect = observeLoadMoreScroll(callback) ?? void 0;
};
const disconnectLoadMoreScrollObserver = () => {
  currentScrollDisconnect?.();
  currentScrollDisconnect = void 0;
};
const ONCE_MOVIE_LIMIT = 20;
const INITIAL_PAGE_NUM = 1;
async function loadInitialMovie() {
  await getPopularMovies({
    pageNum: INITIAL_PAGE_NUM,
    onLoading: () => paintInitialLoading(ONCE_MOVIE_LIMIT),
    onError: () => {
      paintError();
      paintClearBanner();
    },
    onSuccess: ({ movies, page, totalPages }) => {
      MovieState.setNextPageNum(page + 1);
      MovieState.setRequestMovieCount(movies.length);
      paintHomeSectionHeading();
      if (movies.length > 0) {
        paintMovieBanner(movies[0]);
        setupHeaderScrollObserver();
        paintMovieList(movies);
        paintInView();
      }
      if (page >= totalPages) {
        disconnectLoadMoreScrollObserver();
      }
    }
  });
  setupInteractions();
}
function setupInteractions() {
  replaceLoadMoreScrollObserver(loadMoreMovies);
  setupSearchInteraction(loadSearchMovies);
  setupMovieInteraction(loadMovieDetails);
  setupModalCloseInteraction(paintRemoveModal);
}
async function loadMovieDetails(movieId) {
  const savedMyRate = getMyRating(movieId);
  await getMovieDetails({
    movieId,
    onSuccess: (movie) => {
      const renderModalWithRating = (rating) => {
        setMyRating(movieId, rating);
        paintRemoveModal();
        paintMovieModal(movie, rating);
        setupMyRatingInteraction(renderModalWithRating);
      };
      paintRemoveModalSkeleton();
      paintMovieModal(movie, savedMyRate);
      setupMyRatingInteraction(renderModalWithRating);
    },
    onError: () => {
      paintRemoveModalSkeleton();
      paintMovieModalError();
    },
    onLoading: () => paintMovieModalSkeleton()
  });
}
async function loadMoreMovies() {
  await getPopularMovies({
    pageNum: MovieState.getNextPageNum(),
    onError: () => {
      paintError();
      paintClearBanner();
    },
    onLoading: () => paintInitialLoading(MovieState.getRequestMovieCount()),
    onSuccess: ({ page, movies, totalPages }) => {
      MovieState.setNextPageNum(page + 1);
      paintMovieList(movies);
      if (page >= totalPages) {
        disconnectLoadMoreScrollObserver();
      }
    }
  });
}
async function loadSearchMovies(query) {
  disconnectLoadMoreScrollObserver();
  await getSearchMovies({
    query,
    pageNum: INITIAL_PAGE_NUM,
    onError: () => paintError(),
    onLoading: () => paintPrepareSearch(query, MovieState.getRequestMovieCount()),
    onSuccess: ({ page, movies, totalPages }) => {
      MovieState.setNextSearchPageNum(page + 1);
      paintResetList();
      if (movies.length === 0) {
        paintEmptyResult();
      } else {
        paintMovieList(movies);
        if (page < totalPages) {
          replaceLoadMoreScrollObserver(() => loadMoreSearchMovies(query));
        }
      }
    }
  });
}
async function loadMoreSearchMovies(query) {
  await getSearchMovies({
    query,
    pageNum: MovieState.getNextSearchPageNum(),
    onError: () => paintError(),
    onLoading: () => paintInitialLoading(MovieState.getRequestMovieCount()),
    onSuccess: ({ page, movies, totalPages }) => {
      MovieState.setNextSearchPageNum(page + 1);
      paintMovieList(movies);
      if (page >= totalPages) {
        disconnectLoadMoreScrollObserver();
      }
    }
  });
}
render(loadInitialMovie);
