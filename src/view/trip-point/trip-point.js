import {TRANSFER_TYPES, createElement, humanizeTime, createDurationtTimeTemplate} from "../../utils.js";
import TripPointOffers from "./point-offers.js";

export default class TripPoint {
  constructor(tripPoint) {
    this._tripPoint = tripPoint;
    this._element = null;
  }

  getTemplate() {
    const {
      type,
      dateStart,
      dateFinish,
      destination,
      price,
      options
    } = this._tripPoint;

    const tripPointTitle = TRANSFER_TYPES.includes(type, 0)
      ? `${type} to`
      : `${type} in`;

    return (
      `<li class="trip-events__item">
        <div class="event">
          <div class="event__type">
            <img class="event__type-icon" width="42" height="42" src="img/icons/${type}.png" alt="Event type icon">
          </div>
          <h3 class="event__title">${tripPointTitle} ${destination.name}</h3>

          <div class="event__schedule">
            <p class="event__time">
              <time class="event__start-time" datetime="2019-03-18T10:30">
                ${humanizeTime(dateStart)}
              </time>
              &mdash;
              <time class="event__end-time" datetime="2019-03-18T11:00">
                ${humanizeTime(dateFinish)}
              </time>
            </p>
            <p class="event__duration">${createDurationtTimeTemplate(dateStart, dateFinish)}</p>
          </div>

          <p class="event__price">
            &euro;&nbsp;<span class="event__price-value">${price}</span>
          </p>

          <h4 class="visually-hidden">Offers:</h4>
          <ul class="event__selected-offers">
            ${new TripPointOffers(options.offers.slice(0, 3)).getTemplate()}
          </ul>

          <button class="event__rollup-btn" type="button">
            <span class="visually-hidden">Open event</span>
          </button>
        </div>
      </li>`
    );
  }

  getElement() {
    if (!this._element) {
      this._element = createElement(this.getTemplate());
    }

    return this._element;
  }

  removeElement() {
    this._element = null;
  }
}
