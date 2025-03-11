import { Player } from '@/types/game';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface PlayerCardProps {
  player: Player;
  onDelete?: (id: string) => void;
}

export default function PlayerCard({ player, onDelete }: PlayerCardProps) {
  return (
    <Card className="flex justify-between items-center">
      <div className="flex items-center gap-4">
        {player.photoUrl ? (
          <img
            src={player.photoUrl}
            alt={player.name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
            {player.name[0].toUpperCase()}
          </div>
        )}
        <div>
          <h3 className="font-semibold">{player.name}</h3>
          <p className="text-sm text-gray-500">
            Joined {new Date(player.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      
      {onDelete && (
        <Button variant="danger" size="sm" onClick={() => onDelete(player.id)}>
          Delete
        </Button>
      )}
    </Card>
  );
} 