/**
 * Svelte Router route module.
 * @module svelte-router/route
 */
import { HISTORY_ACTION } from './history';
import { Location } from './location';
import { Key } from 'path-to-regexp';
/**
 * Route redirect.
 * * string: plain URL.
 * * object: route name {name: 'ROUTE'}.
 * * function: callback function fn(to) to resolve the redirect.
 */
export declare type routeRedirect = null | string | object | ((to: Route) => string);
/**
 * Props passed to component.
 * * false: default. do not resolve props.
 * * true: auto-resolve props from route params.
 * * object: pass this object directly to component as props.
 * * function: callback function to resolve props from route object.
 * fn(router) => props.
 */
declare type routeProps = boolean | object | ((route: Route) => {
    [k: string]: string;
});
export declare type componentModule = {
    default: object;
};
/**
 * Route config prefab used to generate Route RouteConfig.
 */
export interface RouteConfigPrefab {
    /** Name of the route. */
    name?: string;
    /** URL path use to resolve the route. */
    path: string;
    redirect?: routeRedirect;
    /**
     * Svelte component.
     * Component constructor function or async component resolver
     */
    component?: boolean | (() => object) | Promise<componentModule>;
    /** Route meta object. */
    meta?: {
        [k: string]: string;
    };
    props?: routeProps;
    /** Children routes. */
    children: RouteConfigPrefab[];
}
/**
 * Route Config
 */
export interface RouteConfig extends RouteConfigPrefab {
    /** Route unique ID. */
    id: symbol;
    /** Lazy loaded component flag. */
    async: boolean;
    /** Parent route. */
    parent: RouteConfig | null;
    /** Collection of param keys generated by the pathToRegexp. */
    paramKeys: Partial<Key>[];
    /** Regex URL matcher */
    matcher: RegExp;
    /**
     * URL generator function.
     * @param params router param dictionary.
     */
    generator: (params: {
        [k: string]: string;
    }) => string;
    /** Children routes. */
    children: RouteConfig[];
}
/**
 * Create route config object.
 * @param {module:svelte-router/route~RouteConfig} prefab route config prefab,
 * only properties defined on svelte-router/route~RouteConfig will be used.
 * @throws Will throw an error if the route prefab config is invalid.
 * @return {module:svelte-router/route~RouteConfig}
 */
export declare function createRouteConfig(prefab: RouteConfigPrefab): RouteConfig;
/**
 * Route record.
 */
export interface Record {
    /** Route RouteConfig ID. */
    id: symbol;
    /** Name of the route. */
    name?: string;
    /** URL path use to resolve the route. */
    path: string;
    redirect?: routeRedirect;
    /** Svelte component. */
    component: boolean | (() => object) | Promise<componentModule>;
    /** Lazy loaded component flag. */
    async: boolean;
    /** Route meta object. */
    meta?: {
        [k: string]: string;
    };
    /** Route params */
    params: {
        [k: string]: string;
    };
    props?: routeProps;
}
/**
 * Create route record.
 * @param {RouteConfig} route Matching route config.
 * @param {string[]|object} params Regex exec output or params object.
 * @return {Record}
 */
export declare function createRouteRecord(route: RouteConfig, params: string[] | {
    [k: string]: string | number;
}): Record;
/**
 * Route object.
 */
export interface Route {
    /** Name of the route. */
    name?: string;
    redirect?: routeRedirect;
    /** Router URL without hash or query params */
    path: string;
    /** URL hash. */
    hash: string;
    /** Router full URL. */
    fullPath: string;
    /** Query parameters. */
    query: {
        [k: string]: string;
    };
    /** Captured router parameters. */
    params: {
        [k: string]: string;
    };
    /** Route meta props. */
    meta?: {
        [k: string]: string;
    };
    /** History action. */
    action: HISTORY_ACTION;
    /** Collection of matched router records (top-bottom). */
    matched: Record[];
}
/**
 * Create route object.
 * @param {Location} location triggered location.
 * @param {Record[]} matches collection of matched route records.
 * @return {Route}
 */
export declare function createRoute(location: Location, matches: Record[]): Route;
/**
 * Deep clone route.
 * @param {Route} route source route.
 * @return {Route}
 */
export declare function cloneRoute(route: Route): Route;
export {};
