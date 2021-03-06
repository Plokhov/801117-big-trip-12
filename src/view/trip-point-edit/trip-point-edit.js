import Smart from "../smart.js";
import TripPointTypeList from "./trip-point-type-list.js";
import TripPointEditButtons from "./trip-point-edit-buttons.js";
import TripPointDetails from "./trip-point-details.js";

import {TRANSFER_TYPES, ACTIVITY_TYPES} from "../../const.js";
import {formatFullDate} from "../../utils/trip.js";

import he from "he";
import flatpickr from "flatpickr";
import "../../../node_modules/flatpickr/dist/flatpickr.min.css";

const BLANK_TRIP_POINT = {
  type: `bus`,
  dateStart: new Date(),
  dateFinish: new Date(),
  price: 0,
  destination: {
    name: ``,
    description: `Geneva is a city in Switzerland that lies at the southern
      tip of expansive Lac Léman (Lake Geneva).
      Surrounded by the Alps and Jura mountains,
      the city has views of dramatic Mont Blanc.`,
    pictures: [
      {
        src: `img/photos/1.jpg`,
        description: ``
      }
    ]
  },
  offers: [],
  isFavorite: false,
};

export default class TripPointEdit extends Smart {
  constructor(
      tripPoint = BLANK_TRIP_POINT,
      offersModel,
      destinationsModel,
      isNewTripPoint = false
  ) {
    super();
    this._data = TripPointEdit.parsePointToData(tripPoint);
    this._offersModel = offersModel;
    this._destinationsModel = destinationsModel;
    this._isNewTripPoint = isNewTripPoint;
    this._dateStartDatepicker = null;
    this._dateFinishDatepicker = null;

    this._typeChangeHandler = this._typeChangeHandler.bind(this);
    this._destinationChangeHandler = this._destinationChangeHandler.bind(this);
    this._dateStartChangeHandler = this._dateStartChangeHandler.bind(this);
    this._dateFinishChangeHandler = this._dateFinishChangeHandler.bind(this);
    this._priceInputHandler = this._priceInputHandler.bind(this);
    this._offersChangeHandler = this._offersChangeHandler.bind(this);
    this._favoriteClickHandler = this._favoriteClickHandler.bind(this);
    this._formSubmitHandler = this._formSubmitHandler.bind(this);
    this._formDeleteClickHandler = this._formDeleteClickHandler.bind(this);

    this._setInnerHandlers();
    this._setDateStartDatepicker();
    this._setDateFinishDatepicker();
  }

  getTemplate() {
    const {
      type,
      dateStart,
      dateFinish,
      price,
      destination,
      offers,
      isTransferType,
      isDisabled,
      isSaving,
      isDeleting
    } = this._data;

    const destinations = this._destinationsModel.get();

    const tripPointTitle = isTransferType
      ? `${type} to`
      : `${type} in`;

    const createbuttonName = (deleting, isNewTripPoint) => {
      if (isNewTripPoint) {
        return `Cancel`;
      }

      if (deleting) {
        return `Deleting...`;
      }

      return `Delete`;
    };

    return (
      `<form class="trip-events__item  event  event--edit" action="#" method="post">
        <header class="event__header">
          <div class="event__type-wrapper">
            <label class="event__type  event__type-btn" for="event-type-toggle-1">
              <span class="visually-hidden">Choose event type</span>
              <img class="event__type-icon" width="17" height="17" src="img/icons/${type}.png" alt="Event type icon">
            </label>
            <input class="event__type-toggle  visually-hidden" id="event-type-toggle-1" type="checkbox" ${isDisabled ? `disabled` : ``}>

            <div class="event__type-list">
              <fieldset class="event__type-group">
                <legend class="visually-hidden">Transfer</legend>

                ${new TripPointTypeList(TRANSFER_TYPES, type).getTemplate()}
              </fieldset>

              <fieldset class="event__type-group">
                <legend class="visually-hidden">Activity</legend>

                ${new TripPointTypeList(ACTIVITY_TYPES, type).getTemplate()}
              </fieldset>
            </div>
          </div>

          <div class="event__field-group  event__field-group--destination">
            <label class="event__label  event__type-output" for="event-destination-1">
              ${tripPointTitle}
            </label>
            <input class="event__input  event__input--destination"
              id="event-destination-1"
              type="text"
              name="event-destination"
              value="${destination ? he.encode(destination.name) : ``}"
              list="destination-list-1"
              required
              ${isDisabled ? `disabled` : ``}
            >
            <datalist id="destination-list-1">
              ${destinations.map((it) => `<option value="${it.name}"></option>`).join(``)}
            </datalist>
          </div>

          <div class="event__field-group  event__field-group--time">
            <label class="visually-hidden" for="event-start-time-1">
              From
            </label>
            <input
              class="event__input  event__input--time"
              id="event-start-time-1"
              type="text"
              name="event-start-time"
              value="${formatFullDate(dateStart)}"
              ${isDisabled ? `disabled` : ``}
            >
            &mdash;
            <label class="visually-hidden" for="event-end-time-1">
              To
            </label>
            <input
              class="event__input  event__input--time"
              id="event-end-time-1"
              type="text"
              name="event-end-time"
              value="${formatFullDate(dateFinish)}"
              ${isDisabled ? `disabled` : ``}
            >
          </div>

          <div class="event__field-group  event__field-group--price">
            <label class="event__label" for="event-price-1">
              <span class="visually-hidden">Price</span>
              &euro;
            </label>
            <input
              class="event__input  event__input--price"
              id="event-price-1"
              type="number"
              name="event-price"
              value="${price}"
              ${isDisabled ? `disabled` : ``}
              required
            >
          </div>

          <button class="event__save-btn  btn  btn--blue" type="submit" ${isDisabled ? `disabled` : ``}>
            ${isSaving ? `Saving...` : `Save`}
          </button>
          <button class="event__reset-btn" type="reset" ${isDisabled ? `disabled` : ``}>
            ${createbuttonName(isDeleting, this._isNewTripPoint)}
          </button>

          ${new TripPointEditButtons(this._data).getTemplate()}
        </header>
        ${new TripPointDetails(this._offersModel, type, offers, destination, isDisabled).getTemplate()}
      </form>`
    );
  }

  removeElement() {
    super.removeElement();

    if (this._datepicker) {
      this._datepicker.destroy();
      this._datepicker = null;
    }
  }

  reset(tripPoint) {
    this.updateData(
        TripPointEdit.parsePointToData(tripPoint)
    );
  }

  restoreHandlers() {
    this._setInnerHandlers();
    this._setDateStartDatepicker();
    this._setDateFinishDatepicker();
    this.setFormSubmitHandler(this._callback.formSubmit);
    this.setDeleteClickHandler(this._callback.deleteClick);
  }

  _setDateStartDatepicker() {
    if (this._dateStartDatepicker) {
      this._dateStartDatepicker.destroy();
      this._dateStartDatepicker = null;
    }

    this._dateStartDatepicker = flatpickr(
        this.getElement().querySelector(`#event-start-time-1`),
        {
          enableTime: true,
          time24hr: true,
          dateFormat: `d/m/y H:i`,
          defaultDate: this._data.dateStart,
          onChange: this._dateStartChangeHandler
        }
    );
  }

  _setDateFinishDatepicker() {
    if (this._dateFinishDatepicker) {
      this._dateFinishDatepicker.destroy();
      this._dateFinishDatepicker = null;
    }

    this._dateFinishDatepicker = flatpickr(
        this.getElement().querySelector(`#event-end-time-1`),
        {
          enableTime: true,
          minDate: this._data.dateStart,
          dateFormat: `d/m/y H:i`,
          defaultDate: this._data.dateFinish,
          onChange: this._dateFinishChangeHandler
        }
    );
  }

  _setInnerHandlers() {
    this.getElement()
      .querySelector(`.event__type-list`)
      .addEventListener(`change`, this._typeChangeHandler);

    this.getElement()
      .querySelector(`.event__field-group--destination`)
      .addEventListener(`change`, this._destinationChangeHandler);

    this.getElement()
      .querySelector(`.event__input--price`)
      .addEventListener(`change`, this._priceInputHandler);

    this.getElement()
      .querySelector(`.event__favorite-btn`)
      .addEventListener(`click`, this._favoriteClickHandler);

    if (this.getElement().querySelectorAll(`.event__offer-selector`).length !== 0) {
      this.getElement()
        .querySelector(`.event__available-offers`)
        .addEventListener(`change`, this._offersChangeHandler);
    }
  }

  _typeChangeHandler(evt) {
    evt.preventDefault();

    this.updateData({
      type: evt.target.value,
      options: Object.assign(
          {},
          this._data.options,
          {
            type: evt.target.value,
            offers: [],
          }),
      isTransferType: TRANSFER_TYPES
        .includes(evt.target.value, 0),
    });
  }

  _destinationChangeHandler(evt) {
    evt.preventDefault();
    const newDestination = this._destinationsModel
      .get()
      .filter((it) => {
        return it.name === evt.target.value;
      })[0];

    this.updateData({
      destination: newDestination,
      isDestination: newDestination !== 0,
    });
  }

  _dateStartChangeHandler([userDate]) {
    this.updateData({
      dateStart: userDate,
      dateFinish: userDate
    });
  }

  _dateFinishChangeHandler([userDate]) {
    this.updateData({
      dateFinish: userDate
    });
  }

  _priceInputHandler(evt) {
    evt.preventDefault();
    this.updateData({
      price: +evt.target.value
    });
  }

  _favoriteClickHandler(evt) {
    evt.preventDefault();
    this.updateData({
      isFavorite: !this._data.isFavorite
    });
  }

  _offersChangeHandler(evt) {
    evt.preventDefault();
    const checkedOffers = document.querySelectorAll(`.event__offer-checkbox:checked`);
    const titleCheckedOffers = Array.from(checkedOffers).map((it) => it.name);

    const currentTypeOffers = this._offersModel
      .get()
      .filter((it) => {
        return it.type === this._data.type;
      })[0].offers;

    const newOffers = [];

    titleCheckedOffers.forEach((title) => {
      newOffers.push(currentTypeOffers.filter((it) => {
        return it.title === title;
      })[0]);
    });

    this.updateData({
      offers: newOffers,
    });
  }

  _formSubmitHandler(evt) {
    evt.preventDefault();
    this._callback.formSubmit(TripPointEdit.parseDataToPoint(this._data));
  }

  setFormSubmitHandler(callback) {
    this._callback.formSubmit = callback;
    this.getElement().addEventListener(`submit`, this._formSubmitHandler);
  }

  _formDeleteClickHandler(evt) {
    evt.preventDefault();
    this._callback.deleteClick(TripPointEdit.parseDataToPoint(this._data));
  }

  setDeleteClickHandler(callback) {
    this._callback.deleteClick = callback;
    this.getElement().querySelector(`.event__reset-btn`).addEventListener(`click`, this._formDeleteClickHandler);
  }

  static parsePointToData(tripPoint) {
    return Object.assign(
        {},
        tripPoint,
        {
          isTransferType: TRANSFER_TYPES
            .includes(tripPoint.type, 0),
          isDestination: tripPoint.destination !== null,
          isDisabled: false,
          isSaving: false,
          isDeleting: false
        }
    );
  }

  static parseDataToPoint(data) {
    data = Object.assign({}, data);

    delete data.isTransferType;
    delete data.isDestination;
    delete data.isDisabled;
    delete data.isSaving;
    delete data.isDeleting;

    return data;
  }
}
