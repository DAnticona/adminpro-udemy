import { Injectable } from '@angular/core';
import { Usuario } from '../../models/usuario.model';
import { HttpClient } from '@angular/common/http';
import { URL_SERVICIOS } from '../../config/config';
import { map } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { SubirArchivoService } from '../subir-archivo/subir-archivo.service';

@Injectable({
	providedIn: 'root',
})
export class UsuarioService {
	usuario: Usuario;
	token: string;

	constructor(
		public http: HttpClient,
		public router: Router,
		public subirArchivoService: SubirArchivoService
	) {
		// console.log('Servicio Usuario listo');
		this.cargarStorage();
	}

	estaLogueado() {
		return this.token.length > 5 ? true : false;
	}

	cargarStorage() {
		if (localStorage.getItem('token')) {
			this.token = localStorage.getItem('token');
			this.usuario = JSON.parse(localStorage.getItem('usuario'));
		} else {
			this.token = '';
			this.usuario = null;
		}
	}

	guardarStorage(id: string, token: string, usuario: Usuario) {
		localStorage.setItem('id', id);
		localStorage.setItem('token', token);
		localStorage.setItem('usuario', JSON.stringify(usuario));

		this.usuario = usuario;
		this.token = token;
	}

	logout() {
		this.usuario = null;
		this.token = '';
		// localStorage.clear();
		localStorage.removeItem('token');
		localStorage.removeItem('usuario');

		this.router.navigate(['/login']);
	}

	loginGoogle(token: string) {
		let url = URL_SERVICIOS + '/login/google';

		return this.http.post(url, { token }).pipe(
			map((res: any) => {
				this.guardarStorage(res.id, res.token, res.usuario);
				return true;
			})
		);
	}

	login(usuario: Usuario, recordar: boolean = false) {
		if (recordar) {
			localStorage.setItem('email', usuario.email);
		} else {
			localStorage.removeItem('email');
		}
		let url = URL_SERVICIOS + '/login';

		return this.http.post(url, usuario).pipe(
			map((res: any) => {
				this.guardarStorage(res.id, res.token, res.usuario);
				return true;
			})
		);
	}

	crearUsuario(usuario: Usuario) {
		let url = URL_SERVICIOS + '/usuario';

		return this.http.post(url, usuario).pipe(
			map((res: any) => {
				Swal.fire({
					title: 'Usuario creado',
					text: usuario.email,
					icon: 'success',
					confirmButtonText: 'Ok',
				});
				return res.usuario;
			})
		);
	}

	actualizarUsuario(usuario: Usuario) {
		let url = URL_SERVICIOS + '/usuario/' + usuario._id;

		url += '?token=' + this.token;

		return this.http.put(url, usuario).pipe(
			map((res: any) => {
				if (usuario._id === this.usuario._id) {
					let usuarioDB: Usuario = res.usuario;
					this.guardarStorage(usuarioDB._id, this.token, usuarioDB);
				}

				Swal.fire({
					title: 'Usuario actualizado',
					text: this.usuario.nombre,
					icon: 'success',
				});

				return true;
			})
		);
	}

	cambiarImagen(archivo: File, id: string) {
		this.subirArchivoService
			.subirArchivo(archivo, 'usuarios', id)
			.then((res: any) => {
				this.usuario.img = res.usuario.img;
				Swal.fire({
					title: 'Imagen actualizada',
					text: this.usuario.nombre,
					icon: 'success',
				});

				this.guardarStorage(id, this.token, this.usuario);
			})
			.catch(res => {
				console.log(res);
			});
	}

	cargarUsuarios(desde: number = 0) {
		let url = URL_SERVICIOS + '/usuario?desde=' + desde;
		return this.http.get(url);
	}

	buscarUsuarios(termino: string) {
		let url = URL_SERVICIOS + '/busqueda/coleccion/usuarios/' + termino;
		return this.http.get(url).pipe(map((res: any) => res.usuarios));
	}

	borrarUsuario(id: string) {
		let url = URL_SERVICIOS + '/usuario/' + id;
		url += '?token=' + this.token;

		return this.http.delete(url).pipe(
			map((res: any) => {
				Swal.fire('¡Eliminado!', 'El usuario ' + res.usuario.nombre + ' ha sido eliminado', 'success');
				return true;
			})
		);
	}
}