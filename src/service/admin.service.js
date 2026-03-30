import prisma from "../config/database.js";

export const getUsers = async ({ page, limit, search, filter }) => {
  const skip = (page - 1) * limit;

  //where clause
  const where = {
    isDeleted: false,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { id: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(filter === "active" && { isBanned: false }),
    ...(filter === "banned" && { isBanned: true }),
  };

  const [users, totalRegistered, totalBanned] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBanned: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    //total registered
    prisma.user.count({ where: { isDeleted: false } }),
    // total banned
    prisma.user.count({ where: { isDeleted: false, isBanned: true } }),
  ]);

  const total = await prisma.user.count({ where });

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    stats: {
      totalRegistered,
      totalBanned,
    },
  };
};

export const toggleBanUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (user.isDeleted) {
    const error = new Error("Cannot modify a deleted user");
    error.statusCode = 400;
    throw error;
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isBanned: !user.isBanned },
    select: {
      id: true,
      name: true,
      email: true,
      isBanned: true,
    },
  });

  return updated;
};

export const softDeleteUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (user.isDeleted) {
    const error = new Error("User is already deleted");
    error.statusCode = 400;
    throw error;
  }

  //deleting dentalReports
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isDeleted: true },
    select: { id: true, email: true, isDeleted: true },
  });

  return updated;
};
