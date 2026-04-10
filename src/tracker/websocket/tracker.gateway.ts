import { Logger, Injectable } from '@nestjs/common';
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  OnGatewayInit,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TrackerService } from '../tracker.service';

// Define interface for client data
interface ClientData {
  id: string;
  path: string;
  ip: string;
  connectedAt: Date;
  isAdmin: boolean;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3002',
      'https://www.revsticks.ch',
      'https://revsticks.ch',
      'https://stage.revsticks.ch',
      'https://www.stage.revsticks.ch',
      'http://api-stage.revsticks.ch',
      'https://api-stage.revsticks.ch',
      'http://api.revsticks.ch',
      'https://api.revsticks.ch',
    ],
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
  },
  namespace: '/tracker',
  transports: ['websocket', 'polling'],
  path: '/socket.io',
  pingInterval: 10000,
  pingTimeout: 5000,
})
export class TrackerGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  private logger = new Logger('TrackerGateway');
  private connectedClients = new Map<string, ClientData>();

  constructor(private readonly trackerService: TrackerService) {}

  @WebSocketServer()
  server: Server;

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    // Check if this is an admin connection from query params
    const isAdmin = client.handshake.query.isAdmin === 'true';

    // Store client data with initial values
    this.connectedClients.set(client.id, {
      id: client.id,
      path: '/',
      ip: 'unknown',
      connectedAt: new Date(),
      isAdmin: isAdmin, // Set the admin flag
    });

    // Only track visits for non-admin users
    if (!isAdmin) {
      this.trackerService.addVisit('/'); // Track initial visit
    }

    this.logger.log(
      `Client connected: ${client.id} ${isAdmin ? '(admin)' : ''}`,
    );
  }

  @SubscribeMessage('registerAdmin')
  handleRegisterAdmin(@ConnectedSocket() client: Socket): any {
    const clientData = this.connectedClients.get(client.id);
    if (clientData) {
      clientData.isAdmin = true;
      this.connectedClients.set(client.id, clientData);
      this.logger.log(`Client ${client.id} registered as admin`);
    }
    return { success: true };
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('updatePath')
  handlePathUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { path: string },
  ): any {
    const clientData = this.connectedClients.get(client.id);
    if (clientData && data.path) {
      clientData.path = data.path;
      this.connectedClients.set(client.id, clientData);
      this.logger.log(`Client ${client.id} updated path to: ${data.path}`);

      // Only track visits for non-admin users
      if (!clientData.isAdmin) {
        this.trackerService.addVisit(data.path);
      }
    }

    return {
      event: 'pathUpdated',
      data: {
        success: true,
        currentPath: data.path,
        timestamp: new Date().toISOString(),
      },
    };
  }

  @SubscribeMessage('updateClientInfo')
  handleClientInfoUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { path?: string; ip?: string },
  ): any {
    const clientData = this.connectedClients.get(client.id);
    if (clientData) {
      if (data.path) {
        clientData.path = data.path;
        this.logger.log(`Client ${client.id} updated path to: ${data.path}`);

        // Only track visits for non-admin users when path changes
        if (!clientData.isAdmin) {
          this.trackerService.addVisit(data.path);
        }
      }

      if (data.ip) {
        clientData.ip = data.ip;
        this.logger.log(`Client ${client.id} updated IP to: ${data.ip}`);
      }

      this.connectedClients.set(client.id, clientData);
    }

    return {
      event: 'clientInfoUpdated',
      data: {
        success: true,
        currentInfo: {
          path: clientData?.path,
          ip: clientData?.ip,
        },
        timestamp: new Date().toISOString(),
      },
    };
  }

  @SubscribeMessage('getConnectedCount')
  handleGetConnectedCount(): any {
    // Count only non-admin connections
    const count = Array.from(this.connectedClients.values()).filter(
      (client) => !client.isAdmin,
    ).length;

    this.logger.log(`Request for connected clients count: ${count}`);
    return {
      event: 'connectedCount',
      data: {
        count: count,
        timestamp: new Date().toISOString(),
      },
    };
  }

  @SubscribeMessage('getConnectedCountsByPath')
  handleGetConnectedCountsByPath(): any {
    const pathCounts = Array.from(this.connectedClients.values())
      .filter((client) => !client.isAdmin) // Exclude admin connections
      .reduce(
        (acc, client) => {
          acc[client.path] = (acc[client.path] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

    this.logger.log(
      `Connected clients count by path: ${JSON.stringify(pathCounts)}`,
    );

    return {
      event: 'connectedCountsByPath',
      data: pathCounts,
    };
  }
}
