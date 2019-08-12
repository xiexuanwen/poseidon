import * as net from "net";
import * as pack from "@passoa/pack";
import { Test_mgr } from "./mgr_test";
import { Web_mgr } from "./mgr_web";

class Linkmgr {
	private ints:any;
	private pos:any = new pack.unpackStream();
	private pis:any = new pack.packStream();
	private lk:any = [];
	private app = net.createServer((c:any) =>{
		this.ints = c;
		this.pos.on('data', (data:any) => {
			this.handleCmd(data);
		});
		this.pis.on('data', (data:any) => {
			c.write(data);
		});
		this.ints.on('data', (data:any) => {
			this.pos.push(data);
		});
		this.ints.on('close', () => {
			console.log("linkmgr close");
		});
		this.pis.push({ type: 'init' });
	});

	handleCmd(obj:any){
		if(obj.type != 'info') {
			this.pis.push({ type: 'auth', state: 'fail', msg: 'it is not info cmd!!!' });
			this.ints.end();
		}else{
			if(!this.lk[obj.class])this.lk[obj.class] = [];
			if(this.lk[obj.class][obj.name]){
				this.pis.push({ type: 'auth', state: 'fail', msg: 'your name is already login!!!' });
				this.ints.end();
			}else{
				let link_obj:any;
				switch(obj.class){
					case 'test':
						link_obj = new Test_mgr();
						break;
					case 'web':
						link_obj = new Web_mgr();
						break;
					default:
						this.pis.push({ type: 'auth', state: 'fail', msg: 'Unknow object!!!' });
						return;
				}
				this.lk[obj.class][obj.name] = link_obj;
				link_obj.create(this.ints, obj, this);
				console.info('[link create]' + obj.class + '-' + obj.name + ':' + 'success!!!');
				this.ints.on('close', () => {
					console.info('[link close]' + obj.class + '-' + obj.name + ':' + 'exit!!!');
					this.lk[obj.class][obj.name] = undefined;
				});
			}
		}
	}

	getLink(){
		if (this.lk[arguments[0]]) {
			return this.lk[arguments[0]][arguments[1]];
		}
		return undefined;
	}

	start(){
		this.app.listen(6000);
	}
}

new Linkmgr().start();