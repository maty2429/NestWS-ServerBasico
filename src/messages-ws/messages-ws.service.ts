import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { User } from '../auth/entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
interface ConnectedClients {
  [id: string]: {
    socket: Socket;
    user: User;
  };
}

@Injectable()
export class MessagesWsService {
  private connectedClients: ConnectedClients = {};

  constructor(
    @InjectRepository(User)
    private readonly userRepositoru: Repository<User>,
  ) {}
  async registerClient(client: Socket, userId: string) {
    const user = await this.userRepositoru.findOneBy({ id: userId });
    if (!user) throw new Error('User not foud');
    if (!user.isActive) throw new Error('User not Active');
    this.connectedClients[client.id] = {
      socket: client,
      user: user,
    };
  }

  removeClient(clientId: string) {
    delete this.connectedClients[clientId];
  }

  getConnectedClients(): string[] {
        
    return Object.keys(this.connectedClients); //tengo las propiedades de los clientes conectados y ver cuantos clientas hay conectados
  }

  getUserFullName(socketId: string){
    return this.connectedClients[socketId].user.fullName;
  }
}
