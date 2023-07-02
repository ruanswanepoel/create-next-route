/**
 * Jesus said to them, "Have you never read in the Scriptures:
 *  'The stone the builders rejected
 *    has become the cornerstone;
 *   the Lord has done this,
 *    and it is marvelous in our eyes'?"
 *  - Matthew 21:42
 */

/** @typedef {import('next').NextApiRequest} NextApiRequest */
/** @typedef {import('next').NextApiResponse} NextApiResponse */

/** @typedef {'get' | 'post' | 'put' | 'patch' | 'delete'} HttpMethod */

/** @typedef {{ logger?: any, requireSessionByDefault?: boolean }} NextRouteBuilderOptions */

/** @typedef {{ success: boolean, statusCode: number, message?: string, data?: any }} MethodHandlerReturnType */
/** @typedef {(req: NextApiRequest, res: NextApiResponse) => Promise<MethodHandlerReturnType | null>} MethodHandler */
/** @typedef {{ [method in HttpMethod]?: MethodHandler } & { config?: any }} CreateRouteOptions */

class NextRouteBuilder {
    /**
     *
     * @param {NextRouteBuilderOptions} [options]
     * @returns
     */
    constructor(options) {
        this.options = options || {}
    }

    /**
     *
     * @param {CreateRouteOptions} options
     * @returns
     */
    createRoute(options) {
        /**
         * @param {NextApiRequest} req
         * @param {NextApiResponse} res
         * @returns {Promise<void>}
         */
        return async (req, res) => {
            /** @param {MethodHandlerReturnType} data */
            const success = (data) => {
                this.log(
                    'debug',
                    `Request (${req.method} ${req.url}) successfully resolved with status code: ${data.statusCode}`
                )
                return res.status(data.statusCode).json(data)
            }

            /** @param {MethodHandlerReturnType} data */
            const error = (data) => {
                this.log(
                    'warn',
                    `Request (${req.method} ${req.url}) failed with status code: ${data.statusCode}`
                )
                return res.status(data.statusCode).json(data)
            }

            this.log(
                'debug',
                `Request received: ${req.method} ${
                    req.url
                } | Body: ${JSON.stringify(req.body)}`
            )

            const method = req.method?.toLowerCase()

            if (!method) {
                this.log('warn', 'No method was provided in the request')
                return error({
                    success: false,
                    statusCode: 400,
                    message: 'No method was provided in the request',
                })
            }

            if (!options[method]) {
                this.log(
                    'warn',
                    `No handler was provided for the method: ${method}`
                )
                return error({
                    success: false,
                    statusCode: 400,
                    message: `No handler was provided for the method: ${method}`,
                })
            }

            /** @type {MethodHandlerReturnType} */
            let result

            try {
                result = await options[method](req, res)
            } catch (error) {
                this.log('error', `Error while handling request: ${error}`)
                result = {
                    success: false,
                    statusCode: 500,
                    message: 'Internal Server Error',
                }
            }

            if (!result) {
                return
            }

            if (result.success) {
                return success(result)
            } else {
                return error(result)
            }
        }
    }

    /**
     *
     * @param {'debug' | 'info' | 'warn' | 'error'} level
     * @param {string} message
     */
    log(level, message) {
        try {
            this.options.logger[level](message)
        } catch (error) {
            console.error(
                `[${new Date().toISOString()}] (ERROR): Failed to log a message using the provider logger object: [${level}] ${message}`
            )
            console.error(error)
        }
    }
}

module.exports = NextRouteBuilder
