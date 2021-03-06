import { Component } from '@angular/core';
import {ROUTER_DIRECTIVES, Router, CanActivate} from '@angular/router-deprecated';

import {ImportPgn} from '../buttons/importPgn.component';
import {LoggerService} from '../../services/logger.service';
import {NotificationService, NotificationLevel} from '../../services/notification.service';
import {ImportService} from '../../services/api/import.service';
import {GamesService} from '../../services/api/games.service';
import {Game} from '../../models/game';
import {Observable} from 'rxjs/Observable';
import {GamesCardItem} from './gamesCardItem.component';

@Component({
    providers: [ImportService],
    template: `
        <div>
            <div class="ui icon buttons">
                <import-pgn (onImport)="onPgnImport($event)"></import-pgn>

                <button class="ui button" (click)="loadGames()">
                    <i class="refresh icon"></i>
                </button>
            </div>

            <div class="ui inverted dimmer" [class.active]="_isLoading">
                <div class="ui loader"></div>
            </div>

            <div class="ui cards">
                <gamesCardItem class="card" *ngFor="let game of _games; let i = index" [game]="game" (delete)="onDelete($event, i)"></gamesCardItem>
            <div>

        </div>
    `,
    directives: [ImportPgn, ROUTER_DIRECTIVES, GamesCardItem],
    styles: [`
        .ui.icon.buttons {
            margin-bottom: 2rem;
        }
    `]
})
@CanActivate((next, prev) => {
    // TODO: Implement when we have DI here to get hold of our authenticationService
    // https://github.com/angular/angular/issues/4112
    // For now it is not much of a problem since we will be hiding the link to this component
    // and the back end won't serve any content anyway
    return true;
})
export class GamesList {
    private _games: Observable<Game>[] = [];
    private _isLoading : boolean = true;

    constructor (
        private _logger: LoggerService,
        private _importService: ImportService,
        private _notificationService: NotificationService,
        private _gamesService: GamesService
    ) {
        this.loadGames();
    }

    onPgnImport(pgn : string) {
        this._logger.debug('Importing PGN:\n' + pgn);
        this._importService.uploadPgn(pgn)
            .subscribe(
                () => this._notificationService.notify(NotificationLevel.success, 'Successfully imported PGN.'),
                () => this._notificationService.notify(NotificationLevel.error, 'There was an error importing the PGN.'),
                () => this.loadGames()
            );
    }

    loadGames() {
        this._isLoading = true;
        this._gamesService.getAll()
            .subscribe(
                games => this._games = games,
                () => this._isLoading = false,
                () => this._isLoading = false
            );
    }

    onDelete(id: string, index: number) {
        this._isLoading = true;
        this._gamesService.delete(id)
            .subscribe(
                () => {
                    this._games.splice(index, 1);
                    this._notificationService.notify(NotificationLevel.success, 'Successfully deleted game.');
                },
                () => {
                    this._notificationService.notify(NotificationLevel.error, 'There was an error deleting the game.');
                    this._isLoading = false;
                },
                () => {
                    this._isLoading = false;
                }
            );
    }
}
