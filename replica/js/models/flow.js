/**
 * Flow model: which page comes after which.
 * The chain lives in data/config.json ("flow"), not in the controllers, so changing the
 * route order is a data edit. Keys are route names from config.routes.
 */
export const nextRoute = (config, from) => config.routes[config.flow[from]];
