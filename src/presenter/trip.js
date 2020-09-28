import TripPointPresenter from "./trip-point.js";
import TripPointNewPresenter from "./trip-point-new.js";

import SortView from "../view/sort.js";
import NoTripPointsView from "../view/no-trip-points.js";
import TripDaysListView from "../view/trip-days-list.js";
import TripDayView from "../view/trip-day.js";
import TripPointsListView from "../view/trip-points-list.js";

import {render, RenderPosition, remove} from "../utils/render.js";
import {sortTripPointsInTime, sortTripPointsByDays, sortTripPointsByDuration, sortTripPointsByPrice} from "../utils/trip.js";
import {filter} from "../utils/filter.js";
import {SortType, UpdateType, UserAction, FilterType} from "../const.js";

export default class Trip {
  constructor(tripEventsContainer, tripPointsModel, filterModel, optionsModel, destinationsModel) {
    this._tripEventsContainer = tripEventsContainer;
    this._tripPointsModel = tripPointsModel;
    this._filterModel = filterModel;
    this._optionsModel = optionsModel;
    this._destinationsModel = destinationsModel;

    this._currentSortType = SortType.EVENT;
    this._tripPointPresenter = {};
    this._tripDaysComponents = [];
    this._sortComponent = null;

    this._noTripPointsComponent = new NoTripPointsView();
    this._tripDaysListComponent = new TripDaysListView();

    this._handleViewAction = this._handleViewAction.bind(this);
    this._handleModelEvent = this._handleModelEvent.bind(this);
    this._handleModeChange = this._handleModeChange.bind(this);
    this._handleSortTypeChange = this._handleSortTypeChange.bind(this);

    this._tripPointsModel.addObserver(this._handleModelEvent);
    this._filterModel.addObserver(this._handleModelEvent);
  }

  init() {
    this._renderTrip();
  }

  createTripPoint() {
    this._currentSortType = SortType.EVENT;
    this._filterModel.setFilter(UpdateType.MAJOR, FilterType.EVERYTHING);
    this._tripPointNewPresenter = new TripPointNewPresenter(
        this._tripDaysListComponent.getElement(),
        this._handleViewAction,
        this._optionsModel,
        this._destinationsModel
    );
    this._tripPointNewPresenter.init();
  }

  _getTripPoints() {
    const filterType = this._filterModel.getFilter();
    const tripPoints = this._tripPointsModel.getTripPoints();
    const filtredTripPoints = filter[filterType](tripPoints);

    switch (this._currentSortType) {
      case SortType.TIME:
        return filtredTripPoints.sort(sortTripPointsByDuration);
      case SortType.PRICE:
        return filtredTripPoints.sort(sortTripPointsByPrice);
    }

    return filtredTripPoints;
  }

  _handleModeChange() {
    if (this._tripPointNewPresenter) {
      this._tripPointNewPresenter.destroy();
    }

    Object
      .values(this._tripPointPresenter)
      .forEach((presenter) => presenter.resetView());
  }

  _handleViewAction(actionType, updateType, update) {
    switch (actionType) {
      case UserAction.UPDATE_TRIP_POINT:
        this._tripPointsModel.updateTripPoint(updateType, update);
        break;
      case UserAction.ADD_TRIP_POINT:
        this._tripPointsModel.addTripPoint(updateType, update);
        break;
      case UserAction.DELETE_TRIP_POINT:
        this._tripPointsModel.deleteTripPoint(updateType, update);
        break;
    }
  }

  _handleModelEvent(updateType, data) {
    switch (updateType) {
      case UpdateType.PATCH:
        this._tripPointPresenter[data.id].init(data);
        break;
      case UpdateType.MINOR:
        this._clearTrip();
        this._renderTrip();
        break;
      case UpdateType.MAJOR:
        this._clearTrip({resetSortType: true});
        this._renderTrip();
        break;
    }
  }

  _renderTrip() {
    if (this._getTripPoints().length === 0) {
      this._renderNoTripPoints();
      return;
    }

    this._renderSort();

    if (this._currentSortType !== SortType.EVENT) {
      render(this._tripEventsContainer, this._tripDaysListComponent, RenderPosition.BEFOREEND);
      this._renderTripDay(this._tripDaysListComponent);

      const tripPointsList = this._tripDaysListComponent.getElement().querySelector(`.trip-events__list`);
      this._renderTripPoints(tripPointsList, this._getTripPoints());
      return;
    }

    this._renderTripDaysList();
  }

  _clearTrip({resetSortType = false} = {}) {
    this._tripDaysComponents
    .forEach((tripDay) => {
      remove(tripDay);
    });

    this._tripDaysComponents = [];

    remove(this._noTripPointsComponent);
    remove(this._sortComponent);

    if (resetSortType) {
      this._currentSortType = SortType.EVENT;
    }
  }

  _renderNoTripPoints() {
    render(this._tripEventsContainer, this._noTripPointsComponent, RenderPosition.BEFOREEND);
  }

  _renderSort() {
    if (this._sortComponent !== null) {
      this._sortComponent = null;
    }

    this._sortComponent = new SortView(this._currentSortType);
    render(this._tripEventsContainer, this._sortComponent, RenderPosition.BEFOREEND);
    this._sortComponent.setSortTypeChangeHandler(this._handleSortTypeChange);
  }

  _handleSortTypeChange(sortType) {
    if (this._currentSortType === sortType) {
      return;
    }
    this._clearTrip();
    this._currentSortType = sortType;

    if (this._currentSortType === SortType.EVENT) {
      this._renderTrip();
      return;
    }

    this._renderTrip();
  }

  _renderTripDaysList() {
    this._tripDays = sortTripPointsByDays(this._getTripPoints());

    render(this._tripEventsContainer, this._tripDaysListComponent, RenderPosition.BEFOREEND);

    this._tripDays
      .forEach((tripDay, index) => {
        this._renderTripDay(this._tripDaysListComponent, tripDay, index);
      });
  }

  _renderTripDay(tripDaysContainer, tripDay, dayNumner) {
    const tripDayComponent = new TripDayView(tripDay, dayNumner);
    const tripPointsListComponent = new TripPointsListView();

    render(tripDaysContainer, tripDayComponent, RenderPosition.BEFOREEND);
    render(tripDayComponent, tripPointsListComponent, RenderPosition.BEFOREEND);

    this._tripDaysComponents.push(tripDayComponent);

    if (tripDay) {
      this._renderTripPoints(tripPointsListComponent, sortTripPointsInTime(tripDay.tripPoints));
    }
  }

  _renderTripPoints(tripPointsContainer, tripPoints) {
    tripPoints
      .forEach((tripPoint) => {
        this._renderTripPoint(tripPointsContainer, tripPoint);
      });
  }

  _renderTripPoint(tripPointListElement, tripPoint) {
    const tripPointPresenter = new TripPointPresenter(
        tripPointListElement,
        this._currentSortType,
        this._handleViewAction,
        this._handleModeChange,
        this._optionsModel,
        this._destinationsModel
    );
    tripPointPresenter.init(tripPoint);
    this._tripPointPresenter[tripPoint.id] = tripPointPresenter;
  }
}
