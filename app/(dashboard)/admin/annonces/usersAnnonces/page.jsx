"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { fr } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { FaEllipsisH } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const UserPage = () => {
  const [raison, setRaison] = useState("");
  const [date, setDate] = useState("");
  const [email, setEmail] = useState("");
  const [messageAlert, setMessageAlert] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isSuspendAlertOpen, setIsSuspendAlertOpen] = useState(false);
  const [isActivationAlertOpen, setIsActivationAlertOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userId, setUserId] = useState([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const router = useRouter();

  const fetchAnnoncesUsers = async () => {
    try {
      const response = await fetch("/api/annonce/getAll");
      const data = await response.json();
      console.log(data);

      const updatedData = data.map((annonce) => {
        console.log("Annonce:", annonce);
        console.log(
          "Utilisateur associé:",
          `${annonce.user.nom}  ${annonce.user.prenom}`
        );

        // Récupérer toutes les notes associées à cette annonce
        const notes = annonce.commentaire
          .map((c) => c.note)
          .filter((note) => note !== null); // Exclure les notes nulles

        console.log("Notes associées :", notes);

        if (notes.length > 0) {
          // Calculer la moyenne des notes
          const total = notes.reduce((acc, note) => acc + note, 0);
          const average = total / notes.length;
          console.log("Moyenne des notes :", average.toFixed(2));

          // Ajouter la moyenne à l'annonce sans la formater à l'avance
          annonce.averageNote = average;
        } else {
          console.log("Aucune note trouvée pour cette annonce.");
          annonce.averageNote = 0;
        }

        return annonce; // Retourner l'annonce avec la moyenne mise à jour
      });

      setUsers(updatedData); // Mettre à jour les utilisateurs avec les annonces et les moyennes
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs :", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchAnnoncesUsers();
  }, []);

  const filteredUsersData = useMemo(() => {
    const searchLower = searchFilter.toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        user.titre.toLowerCase().includes(searchLower) ||
        user.description.toLowerCase().includes(searchLower) ||
        user.adresse.toLowerCase().includes(searchLower);

      const matchesCategory =
        categoryFilter === "all" ||
        user.categorieAnnonce.toLowerCase() === categoryFilter.toLowerCase();

      const matchesStatus =
        statusFilter === "all" ||
        user.statut.toLowerCase() === statusFilter.toLowerCase();

      const matchesDateRange =
        !date?.from ||
        !date?.to ||
        (new Date(user.createdAt) >= date.from &&
          new Date(user.createdAt) <= date.to);

      return (
        matchesSearch && matchesCategory && matchesStatus && matchesDateRange
      );
    });
  }, [users, searchFilter, categoryFilter, statusFilter, date]);

  const handleSeeAnnonceInfo = useCallback(
    (annonceId) => {
      console.log("ID de l'annonce sélectionné :", annonceId);
      router.push(`/admin/annonces/usersAnnonces/id=${annonceId}`);
    },
    [router]
  );

  const openAlert = (user) => {
    setSelectedUser(user);
    setEmail(user.email);
    setIsAlertOpen(true);
  };

  const openSuspendAlert = (user) => {
    setSelectedUser(user);
    setEmail(user.email);
    setUserId(user.id);
    setIsSuspendAlertOpen(true);
  };
  const openActivationAlert = (user) => {
    setSelectedUser(user);
    setEmail(user.email);
    setUserId(user.id);
    setIsActivationAlertOpen(true);
  };

  const handleConfirmAlertUser = async () => {
    if (!messageAlert) {
      alert("Veuillez entrer une raison pour la suspension.");
      return;
    }

    try {
      const response = await fetch("/api/user/alertUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          messageAlert,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("L'utilisateur a été alerté et informé par email.");
      } else {
        alert(data.error || "Une erreur s'est produite lors de la suspension.");
      }
    } catch (error) {
      console.error("Erreur lors de la suspension :", error);
      alert("Une erreur s'est produite, veuillez réessayer.");
    } finally {
      // Fermer le dialogue après l'action
      setIsSuspendAlertOpen(false);
    }
  };

  const handleConfirmSuspendUser = async () => {
    if (!raison) {
      alert("Veuillez entrer une raison pour la suspension.");
      return;
    }

    const statutUser = "SUSPENDU";
    try {
      const response = await fetch(`/api/user/suspendUser/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          raison,
          statutUser,
          email,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("L'utilisateur a été suspendu et informé par email.");
        await fetchUsers();
      } else {
        alert(data.error || "Une erreur s'est produite lors de la suspension.");
      }
    } catch (error) {
      console.error("Erreur lors de la suspension :", error);
      alert("Une erreur s'est produite, veuillez réessayer.");
    } finally {
      setIsSuspendAlertOpen(false);
    }
  };

  const handleConfirmActivationUser = async () => {
    const statutUser = "ACTIF";
    try {
      const response = await fetch(`/api/user/activationUser/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          statutUser,
          email,
        }),
      });

      // Vérifiez que la réponse est OK avant de tenter de la convertir en JSON
      if (!response.ok) {
        const textResponse = await response.text(); // Obtenez la réponse en texte brut
        console.error("Erreur du serveur:", textResponse); // Affichez la réponse pour déboguer
        throw new Error(textResponse || "Une erreur s'est produite");
      }

      // Si la réponse est OK, essayez de parser le JSON
      const data = await response.json();

      if (data.error) {
        alert(data.error || "Une erreur s'est produite lors de l'activation.");
        return;
      }

      alert(
        "Le compte de l'utilisateur a été activé et l'utilisateur a été informé par email."
      );
      await fetchUsers();
    } catch (error) {
      console.error("Erreur lors de l'activation :", error);
      alert("Une erreur s'est produite, veuillez réessayer.");
    } finally {
      setIsActivationAlertOpen(false);
    }
  };

  const columns = [
    { accessorKey: "titre", header: "Titre" },
    { accessorKey: "categorieAnnonce", header: "Catégorie" },
    { accessorKey: "adresse", header: "Adresse " },
    {
      header: "Date de publication",
      accessorKey: "createdAt",
      cell: ({ row }) => {
        const createdAt = new Date(row.original.createdAt);

        return createdAt.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      },
    },
    {
      header: "Utilisateur",
      cell: ({ row }) => {
        const utilisateur = row.original.user;
        return utilisateur
          ? `${utilisateur.nom} ${utilisateur.prenom}`
          : "Inconnu";
      },
    },
    {
      header: "Notes",
      cell: ({ row }) => {
        const averageNote = row.original.averageNote;

        if (typeof averageNote === "number" && !isNaN(averageNote)) {
          return averageNote.toFixed(2);
        } else {
          return "Aucune note";
        }
      },
    },

    { accessorKey: "statut", header: "Statut" },
    {
      header: "Actions",
      cell: ({ row }) => {
        const statut = row.original.statut;

        return (
          <div className="flex justify-left">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-fit h-fit p-0">
                  <FaEllipsisH className="cursor-pointer" size={24} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-fit p-2 mt-2">
                <DropdownMenuItem>
                  <Button
                    variant="outline"
                    onClick={() => handleSeeAnnonceInfo(row.original.id)}
                  >
                    Voir les détails
                  </Button>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Button
                    variant="outline"
                    onClick={() => openAlert(row.original.user.id)}
                  >
                    Avertir l&apos;utilisateur
                  </Button>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (row.original.statutUser === "ACTIF") {
                        openSuspendAlert(row.original);
                      } else if (row.original.statutUser === "SUSPENDU") {
                        openActivationAlert(row.original);
                      }
                    }}
                  >
                    {row.original.statutUser === "ACTIF"
                      ? "Suspendre l'annonce"
                      : "Activer l'annonce"}{" "}
                  </Button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filteredUsersData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="space-y-3">
      <h1>Liste de toutes les annonces de LILEE</h1>
      <div className="flex justify-between space-x-10 mx-6">
        <Input
          placeholder="Rechercher ici ..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className="max-w-sm"
        />

        <div className="flex justify-center space-x-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"default"}
                className={cn(
                  "w-[300px] justify-start text-left font-normal",
                  !date && "text-white"
                )}
              >
                <CalendarIcon />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "dd MMM yyyy", { locale: fr })} -{" "}
                      {format(date.to, "dd MMM yyyy", { locale: fr })}
                    </>
                  ) : (
                    format(date.from, "dd MMM yyyy", { locale: fr })
                  )
                ) : (
                  <span>Sélectionner la date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          <Select
            value={categoryFilter}
            onValueChange={(value) => setCategoryFilter(value)}
          >
            <SelectTrigger className="w-fit">
              <SelectValue placeholder="Sélectionner la catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="immobilier">Immobilier</SelectItem>
                <SelectItem value="vetement">Vêtement</SelectItem>
                <SelectItem value="mobilier">Mobilier</SelectItem>
                <SelectItem value="loisir">Loisir</SelectItem>
                <SelectItem value="don">Dons</SelectItem>
                <SelectItem value="emploi">Emploi</SelectItem>
                <SelectItem value="service">Service</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value)}
          >
            <SelectTrigger className="w-fit px-5">
              <SelectValue placeholder="Sélectionner le statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="publiee">Publiée</SelectItem>
                <SelectItem value="suspendue">Suspendue</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <Label htmlFor="email" className="text-[16px] ">
            Email de l&apos;utilisateur :{" "}
            <span className="text-blue-950 font-bold">{email}</span>
          </Label>

          <Label htmlFor="message" className="text-[16px] font-medium">
            Message
          </Label>
          <Textarea
            id="message"
            placeholder="Écrire un message ..."
            value={messageAlert}
            onChange={(e) => setMessageAlert(e.target.value)}
          />
          <div className="flex justify-end space-x-2 mt-4">
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAlertUser}>
              Envoyer
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isSuspendAlertOpen}
        onOpenChange={setIsSuspendAlertOpen}
      >
        <AlertDialogContent>
          <Label htmlFor="email" className="text-[16px]">
            Email de l&apos;utilisateur :{" "}
            <span className="text-blue-950 font-bold">{email}</span>
            <span>Avec l&apos; identifiant :{userId}</span>
          </Label>

          <Label htmlFor="raison" className="text-[16px] font-medium">
            Raison de la suspension
          </Label>
          <Textarea
            id="raison"
            placeholder="Expliquez pourquoi cet utilisateur est suspendu..."
            value={raison}
            onChange={(e) => setRaison(e.target.value)} // Met à jour la raison
          />

          <div className="flex justify-end space-x-2 mt-4">
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSuspendUser}>
              Suspendre
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isActivationAlertOpen}
        onOpenChange={setIsActivationAlertOpen}
      >
        <AlertDialogContent>
          <AlertDialogTitle>
            Êtes-vous sûr d&apos;activer cet utilisateur, avec l&apos; {userId}
          </AlertDialogTitle>
          <div className="flex justify-end space-x-2 mt-4">
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmActivationUser}>
              Activer
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserPage;
