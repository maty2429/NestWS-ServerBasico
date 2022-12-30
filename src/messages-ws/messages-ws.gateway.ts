import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { MessagesWsService } from './messages-ws.service';
import { NewMessageDto } from './dto/new-message.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../auth/interfaces';

@WebSocketGateway({ cors: true }) //necesario para escuchar clientes
export class MessagesWsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() wss: Server;

  constructor(
    private readonly messagesWsService: MessagesWsService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.headers.authentication as string;
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify(token);
      await this.messagesWsService.registerClient(client, payload.id);
    } catch (error) {
      client.disconnect(); //desconectamos al cliente
    }

    console.log({ payload });

    //cuando alguien se conecta
    //  console.log('cliente conectado', client.id);
    this.messagesWsService.registerClient(client, payload.id);

    this.wss.emit(
      'clients-updated',
      this.messagesWsService.getConnectedClients(),
    );
  }
  handleDisconnect(client: Socket) {
    //cuando alguien se desconecta
    // console.log('cliente desconectado',client.id);
    this.messagesWsService.removeClient(client.id);
    this.wss.emit(
      'clients-updated',
      this.messagesWsService.getConnectedClients(),
    );
  }

  @SubscribeMessage('message-from-client') //escuhcar lo que viene del cliente
  onMessageFromClien(client: Socket, payload: NewMessageDto) {
    //message-from-server
    //no emite a todos los clientes, solo al cliente
    /* client.emit('menssge-from-server', {
      fullName: 'Soy yo',
      message: payload.message || 'no-message',
    });*/
    //emite a todo los clientes menos al cliente que lo envio
    /*client.broadcast.emit('menssge-from-server', {
      fullName: 'Soy yo',
      message: payload.message || 'no-message',
    });*/

    //todos los clientes reciven esta informacion
    this.wss.emit('message-from-server', {
      fullName: this.messagesWsService.getUserFullName(client.id),
      message: payload.message || 'no-message',
    });
  }
}
