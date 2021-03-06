import Api from './modules/Api'
import { Config, Find, File, Create, Update, Delete } from '../index.d'

export default class Gitorm {
	private _token: string
	private _repository: string
	private _status: any
	private _owner: string

	constructor({ token, repository, owner, log = false }: Config) {
		this._token = token
		this._repository = repository
		this._owner = owner

		if (!log) {
			console.error = () => {
				return
			}
		}
	}

	async connect(): Promise<void | boolean> {
		try {
			const status = await Api.get(
				`/repos/${this._owner}/${this._repository}`,
				{
					headers: {
						Authorization: 'token ' + this._token
					}
				}
			)
			this._status =
				status && status.data && status.data.git_url
					? status.data.git_url
					: false
		} catch (error) {
			this._status = false
			console.error(error)
		}
	}

	async find({ path }: Find): Promise<File | boolean> {
		if (!this._status) return false

		try {
			const response = await Api.get(
				`/repos/${this._owner}/${this._repository}/contents/${path}`,
				{
					headers: {
						Authorization: 'token ' + this._token
					}
				}
			)
			if (response.status !== 200) return false

			const file: File = response.data

			if (!file) return false

			return {
				name: file.name,
				path: file.path,
				sha: file.sha,
				size: file.size,
				url: file.url,
				html_url: file.html_url,
				git_url: file.git_url,
				download_url: file.download_url,
				type: file.type
			}
		} catch (error) {
			console.error(error)
			return false
		}
	}

	async findAll({ path }: Find): Promise<File[] | boolean> {
		if (!this._status) return false

		try {
			const response = await Api.get(
				`/repos/${this._owner}/${this._repository}/contents/${path}`,
				{
					headers: {
						Authorization: 'token ' + this._token
					}
				}
			)
			if (response.status !== 200) return false

			const files: File[] = response.data

			if (!files || files.length === 0) return false

			return files
		} catch (error) {
			console.error(error)
			return false
		}
	}

	async create({
		data,
		path,
		message = 'Create',
		branch = 'master'
	}: Create): Promise<File | boolean> {
		if (!this._status) return false

		try {
			const fileExists: boolean | File = await this.find({ path })

			if (fileExists) return false

			const response = await Api.put(
				`/repos/${this._owner}/${this._repository}/contents/${path}`,
				{
					message,
					content: Buffer.from(data).toString('base64'),
					branch
				},
				{
					headers: {
						Authorization: 'token ' + this._token
					}
				}
			)

			if (
				response.status !== 200 &&
				response.status !== 201 &&
				response.status !== 422
			)
				return false

			const file: File = response.data.content

			return {
				name: file.name,
				path: file.path,
				sha: file.sha,
				size: file.size,
				url: file.url,
				html_url: file.html_url,
				git_url: file.git_url,
				download_url: file.download_url,
				type: file.type
			}
		} catch (error) {
			console.error(error)
			return false
		}
	}

	async update({
		data,
		path,
		message = 'Update'
	}: Update): Promise<File | boolean> {
		if (!this._status) return false

		try {
			const fileExists: any = await this.find({ path })

			if (!fileExists) return false

			const response = await Api.put(
				`/repos/${this._owner}/${this._repository}/contents/${fileExists.path}`,
				{
					message,
					content: Buffer.from(data).toString('base64'),
					sha: fileExists.sha
				},
				{
					headers: {
						Authorization: 'token ' + this._token
					}
				}
			)

			if (response.status !== 200) return false

			const file: File = response.data.content

			return {
				name: file.name,
				path: file.path,
				sha: file.sha,
				size: file.size,
				url: file.url,
				html_url: file.html_url,
				git_url: file.git_url,
				download_url: file.download_url,
				type: file.type
			}
		} catch (error) {
			console.error(error)
			return false
		}
	}

	async delete({ path, message = 'Delete' }: Delete): Promise<boolean> {
		if (!this._status) return false

		try {
			const fileExists: any = await this.find({ path })

			if (!fileExists) return false

			const response = await Api.delete(
				`/repos/${this._owner}/${this._repository}/contents/${fileExists.path}`,
				{
					data: {
						message,
						sha: fileExists.sha
					},
					headers: {
						Authorization: 'token ' + this._token
					}
				}
			)

			if (response.status !== 200) return false

			return true
		} catch (error) {
			console.error(error)
			return false
		}
	}

	get status(): boolean {
		return this._status
	}
}

module.exports = Gitorm
module.exports.default = Gitorm
